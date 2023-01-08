param($personsrcpath='__missing__', $exts='__missing__', $dtmonth=0, $dtday=0) 

# Write-Host "Extensions = $($exts)"
Write-Host "ps version = $($PSVersionTable.PSVersion)"

# Get-CimInstance -Class Win32_Printer

# Get-PrinterPort

Write-Host "----------------------------------------------"

# Write-Host "----------------------------------------------"

$extensions = ConvertFrom-Json -InputObject $exts

$conditions = { $_.extension -in $extensions  -and $_.CreationTime.Month -eq $dtMonth -and $_.CreationTime.Day -eq $dtday }

return (Get-ChildItem -Path $personsrcpath -Recurse -File | where-object $conditions).FullName | ConvertTo-Json