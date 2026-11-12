# instalar-aula.ps1 — Inserta kit/aula.js (y practica.js si existe) en cada simulación, en español e inglés.
# Es idempotente: quita las etiquetas anteriores y las vuelve a poner con la versión indicada.
# Uso (desde la raíz del repositorio):  powershell -ExecutionPolicy Bypass -File tools\instalar-aula.ps1 [-Version 20261111a]
param([string]$Version = (Get-Date -Format 'yyyyMMdd') + 'a')
$ErrorActionPreference = 'Stop'
$root = Join-Path (Split-Path -Parent $PSScriptRoot) 'simulaciones'
$utf8 = New-Object Text.UTF8Encoding $false
$areas = 'biologia', 'ciencias-tierra', 'fisica', 'quimica-general', 'quimica-inorganica', 'quimica-organica'
$n = 0; $withPractice = 0
foreach ($a in $areas) {
  foreach ($d in Get-ChildItem (Join-Path $root $a) -Directory) {
    if ($d.Name -in 'shared', 'css') { continue }
    $hasP = Test-Path (Join-Path $d.FullName 'practica.js')
    if ($hasP) { $withPractice++ }
    foreach ($f in 'index.html', 'index.en.html') {
      $p = Join-Path $d.FullName $f
      if (-not (Test-Path $p)) { Write-Warning "Falta $p"; continue }
      $s = [IO.File]::ReadAllText($p)
      # quitar instalaciones anteriores
      $s = [regex]::Replace($s, '\r?\n?<script defer(="")? src="(\.\./\.\./kit/aula\.js|practica\.js)\?v=[^"]*"></script>', '')
      $def = if ($s -match 'defer=""') { 'defer=""' } else { 'defer' }
      $tags = "<script $def src=`"../../kit/aula.js?v=$Version`"></script>"
      if ($hasP) { $tags += "`n<script $def src=`"practica.js?v=$Version`"></script>" }
      $m = [regex]::Match($s, '<script[^>]*src="\.\./\.\./kit/simkit(\.en)?\.js[^"]*"></script>')
      if ($m.Success) { $s = $s.Insert($m.Index + $m.Length, "`n" + $tags) }        # SimKit: antes de msim/app para envolver SimKit.create
      elseif ($s -match '</body>') { $i = $s.LastIndexOf('</body>'); $s = $s.Insert($i, $tags + "`n") }   # sin SimKit: botón flotante
      else { $s = $s.TrimEnd() + "`n" + $tags + "`n" }
      [IO.File]::WriteAllText($p, $s, $utf8); $n++
    }
  }
}
"Páginas actualizadas: $n · simulaciones con práctica: $withPractice · versión $Version"
