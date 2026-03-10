<?php

declare(strict_types=1);

$plugin_slug = 'wp-haptic-vibrate';
$root_dir    = dirname(__DIR__);
$source_dir  = $root_dir . DIRECTORY_SEPARATOR . 'dist' . DIRECTORY_SEPARATOR . 'package' . DIRECTORY_SEPARATOR . $plugin_slug;
$zip_path    = $root_dir . DIRECTORY_SEPARATOR . 'dist' . DIRECTORY_SEPARATOR . $plugin_slug . '.zip';

if ( ! is_dir( $source_dir ) ) {
	fwrite( STDERR, "Release package source not found: {$source_dir}" . PHP_EOL );
	exit( 1 );
}

if ( ! class_exists( 'ZipArchive' ) ) {
	fwrite( STDERR, 'The PHP zip extension is required to build the release archive.' . PHP_EOL );
	exit( 1 );
}

$source_dir = realpath( $source_dir );

if ( false === $source_dir ) {
	fwrite( STDERR, 'Unable to resolve the release package source directory.' . PHP_EOL );
	exit( 1 );
}

$zip = new ZipArchive();

if ( file_exists( $zip_path ) && ! unlink( $zip_path ) ) {
	fwrite( STDERR, "Unable to remove existing archive: {$zip_path}" . PHP_EOL );
	exit( 1 );
}

if ( true !== $zip->open( $zip_path, ZipArchive::CREATE | ZipArchive::OVERWRITE ) ) {
	fwrite( STDERR, "Unable to create release archive: {$zip_path}" . PHP_EOL );
	exit( 1 );
}

$source_parent = dirname( $source_dir );
$iterator      = new RecursiveIteratorIterator(
	new RecursiveDirectoryIterator( $source_dir, FilesystemIterator::SKIP_DOTS ),
	RecursiveIteratorIterator::SELF_FIRST
);

foreach ( $iterator as $item ) {
	$full_path = $item->getPathname();
	$local_path = substr( $full_path, strlen( $source_parent ) + 1 );
	$local_path = str_replace( DIRECTORY_SEPARATOR, '/', $local_path );

	if ( $item->isDir() ) {
		$zip->addEmptyDir( $local_path );
		continue;
	}

	$zip->addFile( $full_path, $local_path );
}

$zip->close();

$verification_zip = new ZipArchive();

if ( true !== $verification_zip->open( $zip_path ) ) {
	fwrite( STDERR, "Unable to reopen release archive for verification: {$zip_path}" . PHP_EOL );
	exit( 1 );
}

for ( $index = 0; $index < $verification_zip->numFiles; $index++ ) {
	$entry_name = $verification_zip->getNameIndex( $index );

	if ( false !== strpos( $entry_name, '\\' ) ) {
		$verification_zip->close();
		fwrite( STDERR, "Archive verification failed because entry uses backslashes: {$entry_name}" . PHP_EOL );
		exit( 1 );
	}
}

$verification_zip->close();

fwrite( STDOUT, "Built release archive: {$zip_path}" . PHP_EOL );
