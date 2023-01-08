param($personsrcpath='__missing__', $exts='__missing__', $dtmonth=0, $dtday=0) 

# Write-Host "---------- POWERSHELL ----------"
# Write-Host "ps version = $($PSVersionTable.PSVersion)"
# Write-Host "Extensions = $($exts)"

$extensions = ConvertFrom-Json -InputObject $exts

$conditions = { $_.extension -in $extensions  -and $_.CreationTime.Month -eq $dtMonth -and $_.CreationTime.Day -eq $dtday }

return (Get-ChildItem -Path $personsrcpath -Recurse -File | where-object $conditions).FullName | ConvertTo-Json