param(
  [Parameter(Mandatory = $true)][int]$ProcessId,
  [Parameter(Mandatory = $true)][string]$ExpectedIcon,
  [Parameter(Mandatory = $true)][string]$EvidenceDir
)

$ErrorActionPreference = 'Stop'
if ($env:GITHUB_ACTIONS -ne 'true') {
  throw 'Taskbar brand evidence is CI-only because it requires a visible interactive desktop.'
}

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

New-Item -ItemType Directory -Path $EvidenceDir -Force | Out-Null
$root = [System.Windows.Automation.AutomationElement]::RootElement
$buttonCondition = New-Object System.Windows.Automation.PropertyCondition(
  [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
  [System.Windows.Automation.ControlType]::Button
)
$taskbarButton = $root.FindAll(
  [System.Windows.Automation.TreeScope]::Descendants,
  $buttonCondition
) | Where-Object { $_.Current.Name -eq 'h0x-ADE' } | Select-Object -First 1

if (-not $taskbarButton) {
  throw 'Windows UI Automation did not expose a taskbar button named exactly h0x-ADE.'
}

$bounds = $taskbarButton.Current.BoundingRectangle
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(
  [int]($bounds.Left + ($bounds.Width / 2)),
  [int]($bounds.Top + ($bounds.Height / 2))
)
Start-Sleep -Milliseconds 1200

$screen = [System.Windows.Forms.SystemInformation]::VirtualScreen
$bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
try {
  $graphics.CopyFromScreen($screen.Left, $screen.Top, 0, 0, $bitmap.Size)
  $bitmap.Save((Join-Path $EvidenceDir 'taskbar-hover-h0x-ADE.png'), [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $graphics.Dispose()
  $bitmap.Dispose()
}

$process = Get-Process -Id $ProcessId -ErrorAction Stop
$actualIcon = [System.Drawing.Icon]::ExtractAssociatedIcon($process.Path).ToBitmap()
$expectedIcon = (New-Object System.Drawing.Icon($ExpectedIcon, 32, 32)).ToBitmap()
try {
  if ($actualIcon.Width -ne $expectedIcon.Width -or $actualIcon.Height -ne $expectedIcon.Height) {
    throw 'Packaged executable icon dimensions do not match the generated ICO frame.'
  }
  for ($x = 0; $x -lt $actualIcon.Width; $x++) {
    for ($y = 0; $y -lt $actualIcon.Height; $y++) {
      if ($actualIcon.GetPixel($x, $y).ToArgb() -ne $expectedIcon.GetPixel($x, $y).ToArgb()) {
        throw "Packaged executable icon differs from the generated ICO at pixel $x,$y."
      }
    }
  }
} finally {
  $actualIcon.Dispose()
  $expectedIcon.Dispose()
}

@{
  processId = $ProcessId
  taskbarTooltip = $taskbarButton.Current.Name
  expectedIcon = (Resolve-Path $ExpectedIcon).Path
} | ConvertTo-Json | Set-Content -Path (Join-Path $EvidenceDir 'taskbar-brand.json') -Encoding utf8
