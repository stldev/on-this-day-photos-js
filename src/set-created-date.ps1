param($filedir='__none__', $filename='__none__', $debug=0) 

$fullName = "$($filedir)\$($filename)"

if ($debug -eq 1){
    Write-Host "fullName: $($fullName)";
}

$dtModified = [DateTime](Get-ItemProperty $fullName -Name LastWriteTime).LastWriteTime
Set-ItemProperty -Path $fullName -Name CreationTime -Value $dtModified
