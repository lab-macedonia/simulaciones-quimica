# i18n.ps1 — El español es la única fuente: cada X.en.js se genera desde X.js + X.i18n.json.
#   extraer   : crea X.i18n.json a partir de los pares actuales (verifica que regenerar reproduce X.en.js idéntico).
#   generar   : reescribe X.en.js desde X.js y el diccionario; lista los textos en español sin traducción.
#   comprobar : (por defecto) avisa si algún X.en.js no coincide con lo que se generaría (edición manual o falta regenerar).
# Flujo: editar solo X.js → tools\i18n.ps1 generar → traducir en X.i18n.json ("lit": {"'texto'": "'text'"}) los textos listados → generar.
# Uso: powershell -ExecutionPolicy Bypass -File tools\i18n.ps1 [extraer|generar|comprobar] [-Filtro gases]
param([ValidateSet('extraer', 'generar', 'comprobar')][string]$Modo = 'comprobar', [string]$Filtro = '')
$ErrorActionPreference = 'Stop'
$root = Join-Path (Split-Path -Parent $PSScriptRoot) 'simulaciones'
$utf8 = New-Object Text.UTF8Encoding $false
$RX = [regex]'''(?:\\.|[^''\\])*''|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`'
function Toks($l) { , @($RX.Matches($l) | ForEach-Object { $_.Value }) }
function Skel($l) { $RX.Replace($l, [string][char]1) }
function Wordy($t) { $t -match '[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,}[ ,.;:]+[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,}' -or $t -match '[áéíóúñ¿¡]' }
function Lines($p) { [IO.File]::ReadAllText($p) -split "`n" }
function Gen($es, $lit, $ovr) {
  $occ = CSHash; $out = New-Object string[] $es.Count
  for ($i = 0; $i -lt $es.Count; $i++) {
    $a = $es[$i]; $k = if ($occ.ContainsKey($a)) { $occ[$a] } else { 0 }; $occ[$a] = $k + 1
    if ($ovr.ContainsKey($a) -and $ovr[$a].Count -gt $k -and $null -ne $ovr[$a][$k]) { $out[$i] = $ovr[$a][$k]; continue }
    $out[$i] = $RX.Replace($a, { param($m) if ($lit.ContainsKey($m.Value)) { $lit[$m.Value] } else { $m.Value } })
  }
  , $out
}
function CSHash { New-Object System.Collections.Hashtable([StringComparer]::Ordinal) }   # distingue mayúsculas ('Peso' ≠ 'peso')
function LoadDict($p) {
  # JavaScriptSerializer distingue mayúsculas en las claves (ConvertFrom-Json de PowerShell 5.1 no)
  Add-Type -AssemblyName System.Web.Extensions
  $js = New-Object System.Web.Script.Serialization.JavaScriptSerializer; $js.MaxJsonLength = [int]::MaxValue
  $j = $js.DeserializeObject([IO.File]::ReadAllText($p)); $lit = CSHash; $ovr = CSHash
  if ($j['lit']) { foreach ($k in $j['lit'].Keys) { $lit[$k] = $j['lit'][$k] } }
  if ($j['lines']) { foreach ($k in $j['lines'].Keys) { $ovr[$k] = @($j['lines'][$k]) } }
  $script:keep = CSHash; foreach ($k in @($j['keep'])) { if ($k) { $script:keep[$k] = 1 } }
  return $lit, $ovr
}
$pairs = @(Get-ChildItem $root -Recurse -Filter *.en.js | Where-Object { $_.FullName -notmatch '\\vendor\\' -and $_.FullName -like "*$Filtro*" } | ForEach-Object { @{ en = $_.FullName; es = ($_.FullName -replace '\.en\.js$', '.js'); dict = ($_.FullName -replace '\.en\.js$', '.i18n.json') } } | Where-Object { Test-Path $_.es })
$nOk = 0; $problems = @()
foreach ($p in $pairs) {
  $rel = $p.es.Substring($root.Length + 1)
  $es = Lines $p.es
  if ($Modo -eq 'extraer') {
    $en = Lines $p.en
    if ($es.Count -ne $en.Count) { $problems += "No alineado ($($es.Count) / $($en.Count) líneas): $rel"; continue }
    $lit = CSHash; $bad = CSHash; $keep = CSHash
    for ($i = 0; $i -lt $es.Count; $i++) {
      $a = $es[$i]; $b = $en[$i]; if ($a -ceq $b) { foreach ($t in (Toks $a)) { if (Wordy $t) { $keep[$t] = 1 } }; continue }
      $ta = Toks $a; $tb = Toks $b
      if ($ta.Count -eq $tb.Count -and (Skel $a) -ceq (Skel $b)) {
        for ($k = 0; $k -lt $ta.Count; $k++) { if ($ta[$k] -ceq $tb[$k]) { if (Wordy $ta[$k]) { $keep[$ta[$k]] = 1 } } elseif ($ta[$k] -cne $tb[$k]) { if ($lit.ContainsKey($ta[$k]) -and $lit[$ta[$k]] -cne $tb[$k]) { $bad[$ta[$k]] = 1 } else { $lit[$ta[$k]] = $tb[$k] } } }
      }
    }
    foreach ($k in @($bad.Keys)) { $lit.Remove($k) }
    # Excepciones por línea donde el diccionario no reproduce el inglés
    $ovr = CSHash
    for ($pass = 0; $pass -lt 3; $pass++) {
      $g = Gen $es $lit $ovr; $occ = CSHash; $miss = 0
      for ($i = 0; $i -lt $es.Count; $i++) {
        $a = $es[$i]; $k = if ($occ.ContainsKey($a)) { $occ[$a] } else { 0 }; $occ[$a] = $k + 1
        if ($g[$i] -cne $en[$i]) { if (-not $ovr.ContainsKey($a)) { $ovr[$a] = New-Object object[] 0 }; $arr = [object[]]$ovr[$a]; while ($arr.Count -le $k) { $arr += , $null }; $arr[$k] = $en[$i]; $ovr[$a] = $arr; $miss++ }
      }
      if (-not $miss) { break }
    }
    $g = Gen $es $lit $ovr
    if (($g -join "`n") -cne ($en -join "`n")) { $problems += "No reproducible: $rel"; continue }
    $sl = New-Object System.Collections.Specialized.OrderedDictionary; foreach ($k in ($lit.Keys | Sort-Object)) { $sl[$k] = $lit[$k] }
    $so = New-Object System.Collections.Specialized.OrderedDictionary; foreach ($k in ($ovr.Keys | Sort-Object)) { $so[$k] = @($ovr[$k]) }
    $json = [ordered]@{ nota = 'Diccionario ES→EN. El inglés se genera con tools\i18n.ps1 generar; no editar el .en.js a mano. keep: textos que no se traducen.'; lit = $sl; lines = $so; keep = @($keep.Keys | Sort-Object) } | ConvertTo-Json -Depth 5 -Compress
    [IO.File]::WriteAllText($p.dict, $json, $utf8); $nOk++
    continue
  }
  if (-not (Test-Path $p.dict)) { $problems += "Sin diccionario (ejecuta extraer): $rel"; continue }
  $lit, $ovr = LoadDict $p.dict
  $g = (Gen $es $lit $ovr) -join "`n"
  if ($Modo -eq 'generar') {
    [IO.File]::WriteAllText($p.en, $g, $utf8); $nOk++
    $pend = @(); $occ = CSHash
    foreach ($a in $es) { $k = if ($occ.ContainsKey($a)) { $occ[$a] } else { 0 }; $occ[$a] = $k + 1; if ($ovr.ContainsKey($a) -and $ovr[$a].Count -gt $k -and $null -ne $ovr[$a][$k]) { continue }
      foreach ($t in (Toks $a)) { if (-not $lit.ContainsKey($t) -and -not $script:keep.ContainsKey($t) -and (Wordy $t)) { $pend += $t } } }
    if ($pend.Count) { $problems += "Textos sin traducir en ${rel}:`n      " + (($pend | Select-Object -Unique | Select-Object -First 15) -join "`n      ") }
  } else {
    if ($g -cne ([IO.File]::ReadAllText($p.en))) { $problems += "El inglés no coincide con lo generado (regenera o actualiza el diccionario): $rel" } else { $nOk++ }
  }
}
"$Modo · pares: $($pairs.Count) · correctos: $nOk"
if ($problems.Count) { "Revisar ($($problems.Count)):"; $problems | ForEach-Object { " - $_" }; if ($Modo -eq 'comprobar') { exit 1 } }
