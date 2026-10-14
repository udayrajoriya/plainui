window.spike={violations:[],done:false};
document.addEventListener('securitypolicyviolation',event=>window.spike.violations.push(`${event.violatedDirective}:${event.blockedURI}`));
