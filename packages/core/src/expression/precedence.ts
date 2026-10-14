export const PRECEDENCE:Readonly<Record<string,number>>=Object.freeze({'??':1,'||':2,'&&':3,'===':4,'!==':4,'<':5,'<=':5,'>':5,'>=':5,'+':6,'-':6,'*':7,'/':7,'%':7});
export const UNARY_PRECEDENCE=8;
export const POSTFIX_PRECEDENCE=9;
