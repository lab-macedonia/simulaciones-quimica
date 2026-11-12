# hacer.ps1 — Construye y prueba una simulación MSim nueva de punta a punta.
#   1. Inglés: si existe pares\<sim>.js, arma app.i18n.json (tr.js) y genera app.en.js (i18n.ps1 generar);
#      si no, extrae el diccionario de un app.en.js escrito a mano (i18n.ps1 extraer; ambos archivos deben tener las mismas líneas).
#   2. Revisa la sintaxis de app.js, app.en.js y practica.js.
#   3. Genera index.html, index.en.html, sim.css y las guías ES/EN desde fichas\<sim>.js (nuevo.js).
#   4. Abre la simulación en Edge y recorre etapas, pestañas y controles (probar.js); -Shots guarda capturas en tools\nueva-sim\shots.
# Uso (desde la raíz):  powershell -ExecutionPolicy Bypass -File tools\nueva-sim\hacer.ps1 -Id fisica/cinematica [-Shots] [-NoTest]
# Después: node tools\nueva-sim\registrar.js · powershell -File tools\instalar-aula.ps1 · node tools\guias-aula.js · npm run check
param([Parameter(Mandatory = $true)][string]$Id, [switch]$Shots, [switch]$NoTest)
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
$gen = $PSScriptRoot
$repo = Split-Path -Parent (Split-Path -Parent $gen)
Set-Location $repo
$name = $Id.Split('/')[1]; $rel = $Id -replace '/', '\'
$es = "simulaciones\$rel\app.js"; $en = $es -replace '\.js$', '.en.js'
if (-not (Test-Path $es)) { "Falta $es"; exit 1 }
if (-not (Test-Path "$gen\fichas\$name.js")) { "Falta la ficha tools\nueva-sim\fichas\$name.js"; exit 1 }
$pares = "$gen\pares\$name.js"
if (Test-Path $pares) {
  node "$gen\tr.js" $es $pares
  if (-not (Test-Path $en)) { [IO.File]::WriteAllText((Join-Path $repo $en), '') }
  powershell -NoProfile -ExecutionPolicy Bypass -File tools\i18n.ps1 generar -Filtro "$rel\app.en.js" | Select-Object -Last 4
} else {
  if (-not (Test-Path $en)) { "Falta $en o tools\nueva-sim\pares\$name.js"; exit 1 }
  $la = ([IO.File]::ReadAllText((Resolve-Path $es)) -split "`n").Count; $lb = ([IO.File]::ReadAllText((Resolve-Path $en)) -split "`n").Count
  if ($la -ne $lb) { "LÍNEAS DISTINTAS ES $la / EN $lb"; exit 1 }
  powershell -NoProfile -ExecutionPolicy Bypass -File tools\i18n.ps1 extraer -Filtro $rel | Select-Object -Last 3
}
node -e "const vm=require('vm'),fs=require('fs');for(const f of process.argv.slice(1)){if(!fs.existsSync(f))continue;try{new vm.Script(fs.readFileSync(f,'utf8'))}catch(e){console.log('SINTAXIS',f,e.message)}}" $es $en "simulaciones\$rel\practica.js"
node "$gen\nuevo.js" $repo "$gen\fichas\$name.js"
if ($NoTest) { return }
$dirS = Join-Path $gen 'shots'
if ($Shots) { New-Item -ItemType Directory -Force $dirS | Out-Null; node "$gen\probar.js" $repo $Id $dirS } else { node "$gen\probar.js" $repo $Id }
