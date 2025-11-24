# Maintainer: George Rawlinson <grawlinson@archlinux.org>
# Maintainer: Giovanni Harting <anonfunc@archlinux.org>

pkgname=jellyfin-web
pkgver=10.11.3
pkgrel=1
pkgdesc='Web client for Jellyfin'
arch=(any)
url='https://jellyfin.org'
license=(GPL-2.0-or-later)
makedepends=(
  git
  nodejs
  npm
)
source=(
  "$pkgname::git+https://github.com/fatexs/jellyfin-web#branch=release-10.11.z"
)
sha512sums=('SKIP')
b2sums=('SKIP')

prepare() {
  cd "$pkgname"

  # wtf is this crud?
  # error code EBADENGINE
  # error engine Unsupported engine
  # error engine Not compatible with your version of node/npm: jellyfin-web@10.11.0
  # error notsup Not compatible with your version of node/npm: jellyfin-web@10.11.0
  # error notsup Required: {"node":">=20.0.0","npm":">=9.6.4 <11.0.0","yarn":"YARN NO LONGER USED - use npm instead."}
  # error notsup Actual:   {"npm":"11.6.2","node":"v24.9.0"}
  #patch -p1 -i "$srcdir/remove-npm-version-constraint.patch"

  # download dependencies
  npm ci --no-audit --no-fund --no-update-notifier
}

build() {
  cd "$pkgname"

  npm run build:production
}

package() {
  cd "$pkgname"

  install -vd "$pkgdir/usr/share/jellyfin/web"
  cp -vr dist/* "$pkgdir/usr/share/jellyfin/web"
}

# vim: ts=2 sw=2 et:
