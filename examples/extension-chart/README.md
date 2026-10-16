# Chart.js behavior

This example requires PlainUI 1.x and Chart.js 4.5.1. `chart.js` shows plain JavaScript registration before `mount()`. The Chart instance stays inside the behavior closure, its canvas is under `ui-ignore`, resource success calls the public `renderChart` command, and the command schedules the update through `scope.afterFlush`. Cleanup cancels scheduled work, removes the event listener, and destroys the Chart instance.
