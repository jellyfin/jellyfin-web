DIR     := $(dir $(lastword $(MAKEFILE_LIST)))
# install git and npm
$(info $(shell set -x; if [ "$$(id -u)" = "0" ]; then echo "Installing git"; dnf -y install git npm; fi))
NAME    := jellyfin-web
VERSION := $(shell set -x; sed -ne '/^Version:/s/.*  *//p' $(DIR)/$(NAME).spec)
RELEASE := $(shell set -x; sed -ne '/^Release:/s/.*  *\(.*\)%{.*}.*/\1/p' $(DIR)/$(NAME).spec)
SRPM    := jellyfin-web-$(subst -,~,$(VERSION))-$(RELEASE)$(shell rpm --eval %dist).src.rpm
TARBALL :=$(NAME)-$(subst -,~,$(VERSION)).tar.gz

epel-7-x86_64_repos := https://rpm.nodesource.com/pub_16.x/el/\$$releasever/\$$basearch/

fed_ver := $(shell rpm -E %fedora)
# fallback when not running on Fedora
fed_ver ?= 36
TARGET  ?= fedora-$(fed_ver)-x86_64

outdir  ?= $(PWD)/$(DIR)/

srpm: $(DIR)/$(SRPM)
tarball: $(DIR)/$(TARBALL)

$(DIR)/$(TARBALL):
	cd $(DIR)/;                                          \
	SOURCE_DIR=..                                        \
	WORKDIR="$${PWD}";                                   \
	version=$(VERSION);                                  \
	tar                                                  \
	--transform "s,^\.,$(NAME)-$(subst -,~,$(VERSION))," \
	--exclude='.git*'                                    \
	--exclude='**/.git'                                  \
	--exclude='**/.hg'                                   \
	--exclude=deployment                                 \
	--exclude='*.deb'                                    \
	--exclude='*.rpm'                                    \
	--exclude=$(notdir $@)                               \
	-czf $(notdir $@)                                    \
	-C $${SOURCE_DIR} ./

$(DIR)/$(SRPM): $(DIR)/$(TARBALL) $(DIR)/jellyfin-web.spec
	cd $(DIR)/;                              \
	rpmbuild -bs $(NAME).spec                \
	         --define "_sourcedir $$PWD/"    \
	         --define "_srcrpmdir $(outdir)"

rpms: $(DIR)/$(SRPM)
	mock $(addprefix --addrepo=, $($(TARGET)_repos)) \
	     --enable-network                            \
	     -r $(TARGET) $<
