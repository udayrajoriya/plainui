void (async()=>{
  try {
    window.spike.stage='fetch-component';const response=await fetch('/component.html');
    window.spike.stage='parse-component';const imported=TemplateSpike.parseDeveloperImport(await response.text(),document);
    const definition=imported.querySelector('template[ui-component]');
    if(!definition)throw new Error('Valid component definition was not imported');
    document.querySelector('#component').append(definition.content.cloneNode(true));
    window.spike.stage='ordinary';const ordinary=SanitizerSpike.sanitizeFragment('<div ui-state="{}" data-ui-text="x"><b>safe</b><script>window.__executed=true</script></div>');
    document.querySelector('#fragment').append(ordinary);
    window.spike.stage='enhanced';const enhanced=SanitizerSpike.sanitizeFragment('<div><template ui-if="ok"><p ui-text="ok">fallback</p></template><div ui-text="ok" data-ui-state="{}" ui-app="bad">content</div></div>',true);
    document.querySelector('#enhanced').append(enhanced);
    try{TemplateSpike.parseDeveloperImport('<template ui-component="bad-card"><script>window.__executed=true</script></template>',document);window.spike.badImportRejected=false;}catch{window.spike.badImportRejected=true;}
    window.spike.done=true;
  }catch(error){window.spike.error=`${window.spike.stage}: ${String(error)}`;window.spike.done=true;}
})();
