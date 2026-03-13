<?php

declare(strict_types=1);

$plugin_slug = 'haptic-vibrate';
$root_dir    = dirname(__DIR__);
$package_dir = $root_dir . DIRECTORY_SEPARATOR . 'dist' . DIRECTORY_SEPARATOR . 'package';
$source_dir  = $package_dir . DIRECTORY_SEPARATOR . $plugin_slug;
$zip_path    = $root_dir . DIRECTORY_SEPARATOR . 'dist' . DIRECTORY_SEPARATOR . $plugin_slug . '.zip';
$release_paths = array(
	'admin',
	'assets',
	'includes',
	'languages',
	'public',
	'LICENSE',
	'readme.txt',
	'uninstall.php',
	'haptic-vibrate.php',
);

/**
 * Write an error message and stop the build.
 *
 * @param string $message Error message.
 */
function fail_build( $message ) {
	fwrite( STDERR, $message . PHP_EOL );
	exit( 1 );
}

/**
 * Normalize ZIP entry paths to portable forward-slash form.
 *
 * @param string $path Archive entry path.
 * @return string
 */
function normalize_zip_entry_path( $path ) {
	$path = str_replace( array( '\\', '/' ), '/', $path );
	$path = preg_replace( '#/+#', '/', $path );

	return ltrim( $path, '/' );
}

/**
 * Remove a directory recursively.
 *
 * @param string $directory Directory path.
 */
function remove_directory_recursive( $directory ) {
	if ( ! is_dir( $directory ) ) {
		return;
	}

	$iterator = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator( $directory, FilesystemIterator::SKIP_DOTS ),
		RecursiveIteratorIterator::CHILD_FIRST
	);

	foreach ( $iterator as $item ) {
		$path = $item->getPathname();

		if ( $item->isDir() ) {
			if ( ! rmdir( $path ) ) {
				fail_build( "Unable to remove directory while staging release package: {$path}" );
			}

			continue;
		}

		if ( ! unlink( $path ) ) {
			fail_build( "Unable to remove file while staging release package: {$path}" );
		}
	}

	if ( ! rmdir( $directory ) ) {
		fail_build( "Unable to remove staged release package directory: {$directory}" );
	}
}

/**
 * Ensure a directory exists.
 *
 * @param string $directory Directory path.
 */
function ensure_directory_exists( $directory ) {
	if ( is_dir( $directory ) ) {
		return;
	}

	if ( ! mkdir( $directory, 0777, true ) ) {
		fail_build( "Unable to create directory: {$directory}" );
	}
}

/**
 * Copy a file or directory recursively.
 *
 * @param string $source      Source path.
 * @param string $destination Destination path.
 */
function copy_release_path( $source, $destination ) {
	if ( is_dir( $source ) ) {
		ensure_directory_exists( $destination );

		$iterator = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $source, FilesystemIterator::SKIP_DOTS ),
			RecursiveIteratorIterator::SELF_FIRST
		);

		foreach ( $iterator as $item ) {
			$target_path = $destination . DIRECTORY_SEPARATOR . substr( $item->getPathname(), strlen( $source ) + 1 );

			if ( $item->isDir() ) {
				ensure_directory_exists( $target_path );
				continue;
			}

			ensure_directory_exists( dirname( $target_path ) );

			if ( ! copy( $item->getPathname(), $target_path ) ) {
				fail_build( "Unable to copy file into staged release package: {$target_path}" );
			}
		}

		return;
	}

	ensure_directory_exists( dirname( $destination ) );

	if ( ! copy( $source, $destination ) ) {
		fail_build( "Unable to copy file into staged release package: {$destination}" );
	}
}

/**
 * Stage the release package from the current repository files.
 *
 * @param string   $root_dir      Repository root.
 * @param string   $package_dir   Package directory.
 * @param string[] $release_paths Relative paths to include in the release.
 */
function stage_release_package( $root_dir, $package_dir, array $release_paths ) {
	remove_directory_recursive( $package_dir );
	ensure_directory_exists( $package_dir );

	foreach ( $release_paths as $relative_path ) {
		$source_path      = $root_dir . DIRECTORY_SEPARATOR . $relative_path;
		$destination_path = $package_dir . DIRECTORY_SEPARATOR . $relative_path;

		if ( ! file_exists( $source_path ) ) {
			fail_build( "Release package source path not found: {$source_path}" );
		}

		copy_release_path( $source_path, $destination_path );
	}
}

/**
 * Build the release ZIP with ZipArchive.
 *
 * @param string $source_dir Package source directory.
 * @param string $zip_path   Output ZIP path.
 */
function build_release_archive_with_ziparchive( $source_dir, $zip_path ) {
	$zip = new ZipArchive();

	if ( file_exists( $zip_path ) && ! unlink( $zip_path ) ) {
		fail_build( "Unable to remove existing archive: {$zip_path}" );
	}

	if ( true !== $zip->open( $zip_path, ZipArchive::CREATE | ZipArchive::OVERWRITE ) ) {
		fail_build( "Unable to create release archive: {$zip_path}" );
	}

	$source_parent = dirname( $source_dir );
	$iterator      = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator( $source_dir, FilesystemIterator::SKIP_DOTS ),
		RecursiveIteratorIterator::SELF_FIRST
	);

	foreach ( $iterator as $item ) {
		$full_path  = $item->getPathname();
		$local_path = substr( $full_path, strlen( $source_parent ) + 1 );
		$local_path = normalize_zip_entry_path( $local_path );

		if ( $item->isDir() ) {
			$zip->addEmptyDir( $local_path );
			continue;
		}

		$zip->addFile( $full_path, $local_path );
	}

	$zip->close();
}

/**
 * Build the release ZIP with PowerShell/.NET on Windows.
 *
 * ZipArchive on Windows can still produce backslash entry names in the ZIP
 * central directory even when forward slashes are provided, which causes
 * WordPress to report that the plugin file cannot be found.
 *
 * @param string $source_dir Package source directory.
 * @param string $zip_path   Output ZIP path.
 */
function build_release_archive_with_powershell( $source_dir, $zip_path ) {
	$script_path = dirname( __FILE__ ) . DIRECTORY_SEPARATOR . 'build-release.ps1';

	if ( ! is_file( $script_path ) ) {
		fail_build( "Windows release packaging script not found: {$script_path}" );
	}

	$command = sprintf(
		'powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File %s -SourceDir %s -ZipPath %s 2>&1',
		escapeshellarg( $script_path ),
		escapeshellarg( $source_dir ),
		escapeshellarg( $zip_path )
	);

	$output    = array();
	$exit_code = 0;
	exec( $command, $output, $exit_code );

	if ( 0 !== $exit_code ) {
		fail_build( 'Unable to create release archive with PowerShell: ' . implode( PHP_EOL, $output ) );
	}
}

/**
 * Read ZIP central directory entry names without path normalization.
 *
 * @param string $zip_path ZIP archive path.
 * @return array<int, string>
 */
function get_raw_zip_entry_names( $zip_path ) {
	$zip_contents = file_get_contents( $zip_path );

	if ( false === $zip_contents ) {
		fail_build( "Unable to read release archive for verification: {$zip_path}" );
	}

	$entries = array();
	$offset  = 0;

	while ( false !== $offset ) {
		$offset = strpos( $zip_contents, "PK\x01\x02", $offset );

		if ( false === $offset ) {
			break;
		}

		$header = substr( $zip_contents, $offset, 46 );

		if ( 46 !== strlen( $header ) ) {
			fail_build( 'Archive verification failed because the ZIP central directory is truncated.' );
		}

		$name_length_data    = unpack( 'v', substr( $header, 28, 2 ) );
		$extra_length_data   = unpack( 'v', substr( $header, 30, 2 ) );
		$comment_length_data = unpack( 'v', substr( $header, 32, 2 ) );

		$name_length    = (int) $name_length_data[1];
		$extra_length   = (int) $extra_length_data[1];
		$comment_length = (int) $comment_length_data[1];

		$entry_name = substr( $zip_contents, $offset + 46, $name_length );

		if ( $name_length !== strlen( $entry_name ) ) {
			fail_build( 'Archive verification failed because a ZIP entry name is truncated.' );
		}

		$entries[] = $entry_name;
		$offset   += 46 + $name_length + $extra_length + $comment_length;
	}

	if ( empty( $entries ) ) {
		fail_build( 'Archive verification failed because no ZIP entries were found.' );
	}

	return $entries;
}

if ( ! class_exists( 'ZipArchive' ) ) {
	fail_build( 'The PHP zip extension is required to build the release archive.' );
}

stage_release_package( $root_dir, $source_dir, $release_paths );

$source_dir = realpath( $source_dir );

if ( false === $source_dir ) {
	fail_build( 'Unable to resolve the release package source directory.' );
}

$main_plugin_file = $source_dir . DIRECTORY_SEPARATOR . $plugin_slug . '.php';

if ( ! is_file( $main_plugin_file ) ) {
	fail_build( "Release package main plugin file not found: {$main_plugin_file}" );
}

if ( '\\' === DIRECTORY_SEPARATOR ) {
	build_release_archive_with_powershell( $source_dir, $zip_path );
} else {
	build_release_archive_with_ziparchive( $source_dir, $zip_path );
}

$raw_entry_names = get_raw_zip_entry_names( $zip_path );
$has_main_file   = false;

foreach ( $raw_entry_names as $entry_name ) {
	$normalized_entry_name = normalize_zip_entry_path( $entry_name );

	if ( false !== strpos( $entry_name, '\\' ) ) {
		fail_build( "Archive verification failed because entry uses backslashes: {$entry_name}" );
	}

	if ( 0 !== strpos( $normalized_entry_name, $plugin_slug . '/' ) ) {
		fail_build( "Archive verification failed because entry is not inside the plugin root folder: {$entry_name}" );
	}

	if ( $plugin_slug . '/' . $plugin_slug . '.php' === $normalized_entry_name ) {
		$has_main_file = true;
	}
}

if ( ! $has_main_file ) {
	fail_build( 'Archive verification failed because the main plugin file is missing from the release ZIP.' );
}

fwrite( STDOUT, "Built release archive: {$zip_path}" . PHP_EOL );
