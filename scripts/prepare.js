const { execSync } = require('child_process');

/**
 * The npm `prepare` script needs to run a build to support installing
 * a package from git repositories (this is dumb but a limitation of how
 * npm behaves). We don't want to run these in CI though because
 * building is slow so this script will skip the build when the
 * `SKIP_PREPARE` environment variable has been set.
 */
if (!process.env.SKIP_PREPARE) {
    execSync('webpack --config webpack.prod.js', { stdio: 'inherit' });
}
