param(
	[Parameter(Mandatory = $true)]
	[string]$SourceDir,
	[Parameter(Mandatory = $true)]
	[string]$ZipPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

if (Test-Path -LiteralPath $ZipPath) {
	Remove-Item -LiteralPath $ZipPath -Force
}

$sourceRoot = (Resolve-Path -LiteralPath $SourceDir).Path
$pluginRoot = Split-Path -Leaf $sourceRoot

$zipStream = [System.IO.File]::Open($ZipPath, [System.IO.FileMode]::CreateNew)

try {
	$archive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create, $false)

	try {
		Get-ChildItem -LiteralPath $sourceRoot -Recurse -Force | ForEach-Object {
			$fullName = $_.FullName
			$relative = $fullName.Substring($sourceRoot.Length).TrimStart('\', '/')

			if ([string]::IsNullOrEmpty($relative)) {
				return
			}

			$entryName = ($pluginRoot + '/' + ($relative -replace '\\', '/')).TrimEnd('/')

			if ($_.PSIsContainer) {
				$hasChildren = Get-ChildItem -LiteralPath $fullName -Force | Select-Object -First 1

				if ($null -eq $hasChildren) {
					$archive.CreateEntry($entryName + '/') | Out-Null
				}

				return
			}

			[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $fullName, $entryName) | Out-Null
		}
	} finally {
		$archive.Dispose()
	}
} finally {
	$zipStream.Dispose()
}