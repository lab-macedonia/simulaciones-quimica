# verificar.ps1 — Comprobaciones de mantenimiento que no necesitan Node (complementan tools/check.js).
#   1. Cada simulación tiene index.html, index.en.html y guía docente en ES y EN.
#   2. Paridad ES/EN: cada X.js tiene su X.en.js con el mismo número de líneas y de preguntas (q:).
#   3. Ambas páginas cargan los mismos scripts, en el mismo orden y con la misma versión (?v=).
#   4. kit/aula.js está incluido una sola vez y practica.js está incluido si (y solo si) existe.
#   5. Los enlaces locales src/href de las páginas apuntan a archivos que existen.
# Uso (desde la raíz):  powershell -ExecutionPolicy Bypass -File tools\verificar.ps1
$ErrorActionPreference = 'Stop'
$root = Join-Path (Split-Path -Parent $PSScriptRoot) 'simulaciones'
$errs = New-Object System.Collections.Generic.List[string]; $warn = New-Object System.Collections.Generic.List[string]
function Rel($p) { $p.Substring($root.Length + 1) }
function Scripts($p) { [regex]::Matches([IO.File]::ReadAllText($p), '<script[^>]*\ssrc="([^"]+)"') | ForEach-Object { $_.Groups[1].Value } }
$sims = foreach ($a in 'biologia', 'ciencias-tierra', 'fisica', 'quimica-general', 'quimica-inorganica', 'quimica-organica') { Get-ChildItem (Join-Path $root $a) -Directory | Where-Object { $_.Name -notin 'shared', 'css' } }
foreach ($d in $sims) {
  $id = "$($d.Parent.Name)/$($d.Name)"
  $es = Join-Path $d.FullName 'index.html'; $en = Join-Path $d.FullName 'index.en.html'
  if (-not (Test-Path $es)) { $errs.Add("FALTA index.html: $id"); continue }
  if (-not (Test-Path $en)) { $errs.Add("FALTA index.en.html: $id"); continue }
  foreach ($gp in (Join-Path $root "guias\$($d.Parent.Name)\$($d.Name).html"), (Join-Path $root "guias\en\$($d.Parent.Name)\$($d.Name).html")) { if (-not (Test-Path $gp)) { $errs.Add("FALTA GUÍA: " + (Rel $gp)) } }
  # 3. misma secuencia de scripts y versiones
  $sa = (Scripts $es) -join ' | '; $sb = ((Scripts $en) | ForEach-Object { $_ -replace '\.en\.js', '.js' }) -join ' | '
  if ($sa -ne $sb) { $errs.Add("SCRIPTS ES/EN distintos en ${id}:`n      ES: $sa`n      EN: $sb") }
  # 4. aula y práctica
  $hasP = Test-Path (Join-Path $d.FullName 'practica.js')
  foreach ($p in $es, $en) {
    $s = [IO.File]::ReadAllText($p)
    $na = ([regex]::Matches($s, 'kit/aula\.js')).Count; if ($na -ne 1) { $errs.Add("aula.js aparece $na veces en " + (Rel $p)) }
    $np = ([regex]::Matches($s, 'src="practica\.js')).Count; if ($hasP -and $np -ne 1) { $errs.Add("practica.js no incluido en " + (Rel $p)) }; if (-not $hasP -and $np) { $errs.Add("practica.js incluido pero no existe: " + (Rel $p)) }
    # 5. enlaces locales
    foreach ($m in [regex]::Matches($s, '\s(?:src|href)="([^"]+)"')) {
      $u = $m.Groups[1].Value; if ($u -match '^(https?:|mailto:|data:|#|javascript:)') { continue }
      $u = ($u -split '[#?]')[0]; if (-not $u) { continue }
      $t = [IO.Path]::GetFullPath((Join-Path $d.FullName ($u -replace '/', '\')))
      if (-not (Test-Path $t) -and -not (Test-Path (Join-Path $t 'index.html'))) { $errs.Add("ENLACE roto en " + (Rel $p) + " → " + $m.Groups[1].Value) }
    }
  }
}
# 2. paridad de archivos .js
Get-ChildItem $root -Recurse -Filter *.js | Where-Object { $_.FullName -notmatch '\\vendor\\' -and $_.Name -notmatch '\.en\.js$' } | ForEach-Object {
  $enf = $_.FullName -replace '\.js$', '.en.js'
  if (-not (Test-Path $enf)) { return }
  $ta = [IO.File]::ReadAllText($_.FullName); $tb = [IO.File]::ReadAllText($enf)
  $la = ($ta -split "`n").Count; $lb = ($tb -split "`n").Count; $qa = ([regex]::Matches($ta, '\bq\s*:')).Count; $qb = ([regex]::Matches($tb, '\bq\s*:')).Count
  if ($qa -ne $qb) { $errs.Add("PREGUNTAS ES/EN distintas ($qa / $qb): " + (Rel $_.FullName)) }
  elseif ([Math]::Abs($la - $lb) -gt 5) { $warn.Add("Líneas ES/EN muy distintas ($la / $lb): " + (Rel $_.FullName)) }
}
# 6. el inglés generado coincide con el diccionario (tools\i18n.ps1)
$i18n = & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'i18n.ps1') comprobar
if ($LASTEXITCODE) { $i18n | Select-Object -Skip 1 | ForEach-Object { $errs.Add('I18N ' + $_.Trim()) } }
"$($sims.Count) simulaciones revisadas · " + ($i18n | Select-Object -First 1)
if ($warn.Count) { "AVISOS ($($warn.Count)):"; $warn | ForEach-Object { " - $_" } }
if ($errs.Count) { "ERRORES ($($errs.Count)):"; $errs | Select-Object -First 60 | ForEach-Object { " - $_" }; exit 1 } else { 'OK: sin errores.' }
