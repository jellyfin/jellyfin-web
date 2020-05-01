VERSION := $(shell sed -ne '/^Version:/s/.*  *//p' fedora/jellyfin-web.spec)

srpm:
	cd fedora/;                                                                   \
	SOURCE_DIR=..                                                                 \
	WORKDIR="$${PWD}";                                                            \
	tar                                                                           \
	--transform "s,^\.,jellyfin-web-$(VERSION),"                                  \
	--exclude='.git*'                                                             \
	--exclude='**/.git'                                                           \
	--exclude='**/.hg'                                                            \
	--exclude='deployment'                                                        \
	--exclude='*.deb'                                                             \
	--exclude='*.rpm'                                                             \
	--exclude='jellyfin-web-$(VERSION).tar.gz'                                    \
	-czf "jellyfin-web-$(VERSION).tar.gz"                                         \
	-C $${SOURCE_DIR} ./
	cd fedora/;                                                                   \
	rpmbuild -bs jellyfin-web.spec                                                \
	         --define "_sourcedir $$PWD/"                                         \
	         --define "_srcrpmdir $(outdir)"
