%global         debug_package %{nil}

Name:           jellyfin-web
Version:        10.6.2
Release:        1%{?dist}
Summary:        The Free Software Media System web client
License:        GPLv3
URL:            https://jellyfin.org
# Jellyfin Server tarball created by `make -f .copr/Makefile srpm`, real URL ends with `v%{version}.tar.gz`
Source0:        jellyfin-web-%{version}.tar.gz

%if 0%{?centos}
BuildRequires:  yarn
%else
BuildRequires:  nodejs-yarn
%endif
BuildArch:		noarch

# Disable Automatic Dependency Processing
AutoReqProv:    no

%description
Jellyfin is a free software media system that puts you in control of managing and streaming your media.


%prep
%autosetup -n jellyfin-web-%{version} -b 0

%build

%install
yarn install
%{__mkdir} -p %{buildroot}%{_datadir}
mv dist %{buildroot}%{_datadir}/jellyfin-web
%{__install} -D -m 0644 LICENSE %{buildroot}%{_datadir}/licenses/jellyfin/LICENSE

%files
%attr(755,root,root) %{_datadir}/jellyfin-web
%{_datadir}/licenses/jellyfin/LICENSE

%changelog
* Sun Aug 02 2020 Jellyfin Packaging Team <packaging@jellyfin.org>
- New upstream version 10.6.2; release changelog at https://github.com/jellyfin/jellyfin-web/releases/tag/v10.6.2
* Mon Jul 27 2020 Jellyfin Packaging Team <packaging@jellyfin.org>
- New upstream version 10.6.1; release changelog at https://github.com/jellyfin/jellyfin-web/releases/tag/v10.6.1
* Mon Mar 23 2020 Jellyfin Packaging Team <packaging@jellyfin.org>
- Forthcoming stable release
