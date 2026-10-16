#!/usr/bin/env python3
"""Independent alternate-envelope fixture backend for PlainUI examples."""
from __future__ import annotations
import argparse, copy, html, io, json, os, re, signal, threading, time
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit
from python_multipart import parse_form

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[2]
SEEDS=json.loads((REPO/'examples/contracts/seeds.json').read_text('utf-8'))
LIMITS=json.loads((REPO/'examples/contracts/api.json').read_text('utf-8'))['uploads']

class State:
    def __init__(self): self.lock=threading.RLock();self.reset()
    def reset(self):
        with getattr(self,'lock',threading.RLock()): self.data=copy.deepcopy(SEEDS);self.data['orders']=[];self.sessions={};self.request=0;self.session=0;self.order=0
    def request_id(self):
        with self.lock:self.request+=1;return f'demo-{self.request}'
STATE=State()

def page(items,query,key):
    try:number=max(1,int(query.get('page',['1'])[0]))
    except ValueError:number=1
    needle=query.get('q',[''])[0].lower();filtered=[item for item in items if not needle or needle in str(item[key]).lower()];start=(number-1)*10
    return {'items':filtered[start:start+10],'page':number,'pageSize':10,'total':len(filtered)}

class Handler(BaseHTTPRequestHandler):
    server_version='PlainUIFixturePython/1.0'
    def log_message(self,format,*args): return
    def request_id(self):
        value=STATE.request_id();self._request_id=value;return value
    def session(self):
        parsed=SimpleCookie(self.headers.get('Cookie',''));key=parsed.get('plainui_demo_session');item=STATE.sessions.get(key.value) if key else None
        if item is None:
            STATE.session+=1;identifier=f's{STATE.session}';item={'id':identifier,'user':None,'csrf':STATE.data['csrfToken']};STATE.sessions[identifier]=item;self._set_cookie=f'plainui_demo_session={identifier}; HttpOnly; SameSite=Lax; Path=/'
        return item
    def headers_common(self,content_type=None):
        self.send_header('x-request-id',self._request_id)
        if content_type:self.send_header('content-type',content_type)
        if getattr(self,'_set_cookie',None):self.send_header('set-cookie',self._set_cookie)
    def send_json(self,status,value):
        payload=b'' if status==204 else json.dumps({'payload':value,'meta':{'requestId':self._request_id}},separators=(',',':')).encode()
        self.send_response(status);self.headers_common('application/json; charset=utf-8');self.send_header('content-length',str(len(payload)));self.end_headers();self.wfile.write(payload)
    def send_error_json(self,status,kind,detail,fields=None):
        violations=[{'field':name,'messages':messages} for name,messages in (fields or {}).items()];payload=json.dumps({'error':{'type':kind,'detail':detail,'violations':violations},'trace':self._request_id},separators=(',',':')).encode()
        self.send_response(status);self.headers_common('application/json; charset=utf-8');self.send_header('content-length',str(len(payload)));self.end_headers();self.wfile.write(payload)
    def read_json(self):
        length=int(self.headers.get('content-length','0')); 
        if length>LIMITS['maxRequestBytes']:raise OverflowError()
        try:return json.loads(self.rfile.read(length) or b'null')
        except (ValueError,json.JSONDecodeError):raise ValueError('json')
    def csrf(self,item):return self.headers.get('x-csrf-token')==item['csrf']
    def user(self,item):return next((user for user in STATE.data['users'] if user['id']==item['user']),None)
    def control(self):
        if not self.server.test_mode:return False
        try:delay=min(5000,max(0,int(self.headers.get('x-plainui-test-delay','0'))))
        except ValueError:delay=0
        if delay:time.sleep(delay/1000)
        try:forced=int(self.headers.get('x-plainui-test-error','0'))
        except ValueError:forced=0
        if 400<=forced<=599:self.send_error_json(forced,'TEST_ERROR','Test-only forced error');return True
        return False
    def do_GET(self):self.handle_request('GET')
    def do_POST(self):self.handle_request('POST')
    def do_PATCH(self):self.handle_request('PATCH')
    def do_DELETE(self):self.handle_request('DELETE')
    def handle_request(self,method):
        self.request_id();item=self.session();parts=urlsplit(self.path);path=parts.path;query=parse_qs(parts.query,keep_blank_values=True)
        try:
            if self.control():return
            if path=='/__test/reset' and method=='POST':
                if not self.server.test_mode or self.client_address[0] not in ('127.0.0.1','::1'):return self.send_error_json(404,'NOT_FOUND','Record not found')
                STATE.reset();return self.send_json(204,None)
            if path=='/api/articles' and method=='GET':return self.send_json(200,page(STATE.data['articles'],query,'title'))
            match=re.fullmatch(r'/api/articles/([^/]+)',path)
            if match and method=='GET':
                value=next((entry for entry in STATE.data['articles'] if entry['id']==unquote(match.group(1))),None);return self.send_json(200,value) if value else self.send_error_json(404,'NOT_FOUND','Record not found')
            match=re.fullmatch(r'/fragments/articles/([^/]+)',path)
            if match and method=='GET':
                identifier=unquote(match.group(1));article=next((entry for entry in STATE.data['articles'] if entry['id']==identifier),None)
                if not article:return self.send_error_json(404,'NOT_FOUND','Record not found')
                return self.send_html(f'<article><h1>{html.escape(article["title"])}</h1><p>{html.escape(STATE.data["articleBodies"][identifier])}</p></article>')
            if path=='/api/products' and method=='GET':return self.send_json(200,page(STATE.data['products'],query,'name'))
            match=re.fullmatch(r'/api/products/([^/]+)',path)
            if match and method=='GET':
                value=self.product(unquote(match.group(1)));return self.send_json(200,value) if value else self.send_error_json(404,'NOT_FOUND','Record not found')
            if path=='/api/orders' and method=='POST':return self.order_endpoint(item)
            match=re.fullmatch(r'/api/orders/by-client-id/([^/]+)',path)
            if match and method=='GET':
                value=next((entry for entry in STATE.data['orders'] if entry['clientOrderId']==unquote(match.group(1))),None);return self.send_json(200,value) if value else self.send_error_json(404,'NOT_FOUND','Record not found')
            match=re.fullmatch(r'/fragments/orders/([^/]+)',path)
            if match and method=='GET':
                order=next((entry for entry in STATE.data['orders'] if entry['id']==unquote(match.group(1))),None)
                if not order:return self.send_error_json(404,'NOT_FOUND','Record not found')
                return self.send_html(f'<section><h2>Order {html.escape(order["id"])}</h2><p>Total: {order["totalCents"]} {html.escape(order["currency"])}</p></section>')
            if path=='/api/session' and method=='POST':return self.login(item)
            if path=='/api/session' and method=='GET':
                user=self.user(item);return self.send_json(200,{'user':user}) if user else self.send_error_json(401,'UNAUTHORIZED','Sign in required')
            if path=='/api/session' and method=='DELETE':
                if not self.csrf(item):return self.send_error_json(403,'CSRF','CSRF token is invalid')
                STATE.sessions.pop(item['id'],None);self._set_cookie='plainui_demo_session=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/';return self.send_json(204,None)
            if path=='/api/projects' and method=='GET':
                if not self.user(item):return self.send_error_json(401,'UNAUTHORIZED','Sign in required')
                return self.send_json(200,page(STATE.data['projects'],query,'name'))
            match=re.fullmatch(r'/api/projects/([^/]+)',path)
            if match and method=='GET':
                if not self.user(item):return self.send_error_json(401,'UNAUTHORIZED','Sign in required')
                value=self.project(unquote(match.group(1)));return self.send_json(200,value) if value else self.send_error_json(404,'NOT_FOUND','Record not found')
            if match and method=='PATCH':return self.patch_project(item,unquote(match.group(1)))
            match=re.fullmatch(r'/api/projects/([^/]+)/activity',path)
            if match and method=='GET':
                if not self.user(item):return self.send_error_json(401,'UNAUTHORIZED','Sign in required')
                identifier=unquote(match.group(1));
                if not self.project(identifier):return self.send_error_json(404,'NOT_FOUND','Record not found')
                return self.send_json(200,page([entry for entry in STATE.data['activities'] if entry['projectId']==identifier],query,'message'))
            match=re.fullmatch(r'/api/projects/([^/]+)/metrics',path)
            if match and method=='GET':
                if not self.user(item):return self.send_error_json(401,'UNAUTHORIZED','Sign in required')
                return self.send_json(200,STATE.data['metrics']) if self.project(unquote(match.group(1))) else self.send_error_json(404,'NOT_FOUND','Record not found')
            if path=='/api/uploads' and method=='POST':return self.upload()
            if path.startswith(('/api/','/fragments/','/__test/')):return self.send_error_json(404,'NOT_FOUND','Record not found')
            return self.static(path,method,item)
        except OverflowError:return self.send_error_json(413,'PAYLOAD_TOO_LARGE','Request exceeds limits')
        except (ValueError,TypeError):return self.send_error_json(422,'VALIDATION','Invalid request')
    def product(self,identifier):return next((entry for entry in STATE.data['products'] if entry['id']==identifier),None)
    def project(self,identifier):return next((entry for entry in STATE.data['projects'] if entry['id']==identifier),None)
    def order_endpoint(self,item):
        if not self.csrf(item):return self.send_error_json(403,'CSRF','CSRF token is invalid')
        value=self.read_json();fields={};client=value.get('clientOrderId','') if isinstance(value,dict) else ''
        if not isinstance(client,str) or not client or len(client)>64:fields['clientOrderId']=['Enter a client order ID']
        if not isinstance(value,dict) or not isinstance(value.get('email'),str) or '@' not in value['email']:fields['email']=['Enter a valid email']
        if not isinstance(value,dict) or not isinstance(value.get('address'),str) or len(value['address'].strip())<5:fields['address']=['Enter an address']
        raw=value.get('items') if isinstance(value,dict) else None;quantities={}
        if not isinstance(raw,list) or not raw:fields['items']=['Add at least one item']
        else:
            for line in raw:
                if not isinstance(line,dict) or not isinstance(line.get('productId'),str) or not isinstance(line.get('quantity'),int) or isinstance(line.get('quantity'),bool) or not 1<=line['quantity']<=99:fields['items']=['Use quantities from 1 to 99'];continue
                quantities[line['productId']]=quantities.get(line['productId'],0)+line['quantity']
        lines=[]
        for product_id,quantity in quantities.items():
            product=self.product(product_id)
            if not product or quantity>product['stock']:fields['items']=['A product is unavailable'];continue
            lines.append({'productId':product_id,'quantity':quantity,'unitPriceCents':product['priceCents']})
        if fields:return self.send_error_json(422,'VALIDATION','Check the form',fields)
        existing=next((entry for entry in STATE.data['orders'] if entry['clientOrderId']==client),None)
        if existing:
            same=[{'productId':x['productId'],'quantity':x['quantity']} for x in existing['items']]==[{'productId':x['productId'],'quantity':x['quantity']} for x in lines] and existing['email']==value['email']
            return self.send_json(200,existing) if same else self.send_error_json(409,'CONFLICT','Client order ID already has different content',{'clientOrderId':['Use a new client order ID']})
        for line in lines:self.product(line['productId'])['stock']-=line['quantity']
        STATE.order+=1;order={'id':f'o{STATE.order}','clientOrderId':client,'email':value['email'],'items':lines,'totalCents':sum(x['quantity']*x['unitPriceCents'] for x in lines),'currency':'USD','status':'confirmed'};STATE.data['orders'].append(order);return self.send_json(201,order)
    def login(self,item):
        if not self.csrf(item):return self.send_error_json(403,'CSRF','CSRF token is invalid')
        value=self.read_json()
        if not isinstance(value,dict) or value.get('email')!='demo@example.test' or value.get('password')!=STATE.data['demoPassword']:return self.send_error_json(401,'UNAUTHORIZED','Invalid sample credentials')
        STATE.sessions.pop(item['id'],None);STATE.session+=1;identifier=f's{STATE.session}';STATE.sessions[identifier]={'id':identifier,'user':'u1','csrf':item['csrf']};self._set_cookie=f'plainui_demo_session={identifier}; HttpOnly; SameSite=Lax; Path=/';return self.send_json(200,{'user':STATE.data['users'][0]})
    def patch_project(self,item,identifier):
        if not self.user(item):return self.send_error_json(401,'UNAUTHORIZED','Sign in required')
        if not self.csrf(item):return self.send_error_json(403,'CSRF','CSRF token is invalid')
        project=self.project(identifier)
        if not project:return self.send_error_json(404,'NOT_FOUND','Record not found')
        value=self.read_json();fields={}
        if not isinstance(value,dict) or not isinstance(value.get('name'),str) or not 3<=len(value['name'].strip())<=80:fields['name']=['Use 3 to 80 characters']
        if not isinstance(value,dict) or not isinstance(value.get('description'),str) or len(value['description'])>1000:fields['description']=['Use at most 1000 characters']
        if fields:return self.send_error_json(422,'VALIDATION','Check the form',fields)
        project.update(name=value['name'].strip(),description=value['description'],updatedAt='2026-01-04T12:00:00Z');STATE.data['activities'].append({'id':f'ac-edit-{len(STATE.data["activities"])+1}','projectId':identifier,'message':'Project updated','createdAt':project['updatedAt']});return self.send_json(200,project)
    def upload(self):
        length=int(self.headers.get('content-length','0'))
        if length>LIMITS['maxRequestBytes']:raise OverflowError()
        fields=[];files=[]
        def text(value,encoding='utf-8'):
            if isinstance(value,bytes):return value.decode(encoding,'replace')
            return str(value or '')
        def on_field(field):
            name=text(field.field_name);value=text(field.value)
            if len(fields)>=LIMITS['maxFields'] or len(value.encode())>LIMITS['maxFieldBytes']:raise OverflowError()
            fields.append([name,value])
        def on_file(file):
            if len(files)>=LIMITS['maxFiles'] or file.size>LIMITS['maxFileBytes']:raise OverflowError()
            files.append({'field':text(file.field_name),'name':Path(text(file.file_name)).name,'size':file.size,'type':text(file.content_type or 'application/octet-stream','ascii')})
        parse_form({'Content-Type':self.headers.get('content-type','').encode(),'Content-Length':str(length).encode()},self.rfile,on_field,on_file,chunk_size=65536)
        return self.send_json(200,{'fields':fields,'files':files})
    def send_html(self,text):
        payload=text.encode();self.send_response(200);self.headers_common('text/html; charset=utf-8');self.send_header('content-length',str(len(payload)));self.end_headers();self.wfile.write(payload)
    def static(self,path,method,item):
        relative=unquote(path).lstrip('/');candidate=(self.server.frontend/relative).resolve()
        try:candidate.relative_to(self.server.frontend)
        except ValueError:return self.send_not_found()
        if method=='GET' and candidate.is_file():
            payload=candidate.read_bytes();content={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'}.get(candidate.suffix,'application/octet-stream');self.send_response(200);self.headers_common(content);self.send_header('content-length',str(len(payload)));self.end_headers();self.wfile.write(payload);return
        if method=='GET' and not Path(relative).suffix and (self.server.frontend/'index.html').is_file():
            text=(self.server.frontend/'index.html').read_text('utf-8').replace('</head>',f'<meta name="csrf-token" content="{html.escape(item["csrf"])}"></head>');return self.send_html(text)
        return self.send_not_found()
    def send_not_found(self):self.send_response(404);self.headers_common();self.end_headers()

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--host',default='127.0.0.1');parser.add_argument('--port',type=int,default=43182);parser.add_argument('--root',default=str(REPO/'examples'));parser.add_argument('--data-dir',default=str(REPO/'.tools/backend-python'));parser.add_argument('--test-mode',action='store_true');args=parser.parse_args();Path(args.data_dir).resolve().mkdir(parents=True,exist_ok=True)
    server=ThreadingHTTPServer((args.host,args.port),Handler);server.frontend=Path(args.root).resolve();server.test_mode=args.test_mode
    address=server.server_address;print(json.dumps({'server':'python','host':address[0],'port':address[1],'dataDir':str(Path(args.data_dir).resolve()),'frontend':str(server.frontend),'testMode':args.test_mode}),flush=True)
    def stop(*_):threading.Thread(target=server.shutdown,daemon=True).start()
    signal.signal(signal.SIGINT,stop);signal.signal(signal.SIGTERM,stop)
    try:server.serve_forever(poll_interval=.1)
    finally:server.server_close()
if __name__=='__main__':main()
