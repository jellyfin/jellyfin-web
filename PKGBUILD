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
  "$pkgname::git+https://github.com/fatexs/jellyfin-web/tree/release-10.11.z"
  remove-npm-version-constraint.patch
)
sha512sums=('SKIP'
            '63b57be505e31bb91469db84b96d6bb2d363324c4a4cde7a1e5f476a5aa6a6fb4d962871a307317ea81dce7cbac6864982a39aeb470dc632492d332a9e8dbd11')
b2sums=('SKIP'
        'f7c3d837a0d33b9d6ef4a52d43111258795dd411627d5fad050d06247ea29d08625fb13bf1953063ba46e56f85d097b1edea316510c7b0a564f90f1d66d1a3cc')

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
