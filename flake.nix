{
  description = "jellyfin-web nix flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = import nixpkgs {
          inherit system;
        };
      in {
        devShell = with pkgs;
          mkShell rec {
            buildInputs = [
              nodejs_24
            ];

            shellHook = ''
              # Also see: https://github.com/sass/embedded-host-node/issues/334
              echo "Removing sass-embedded from node-modules as its broken on NixOS."
              rm -rf node_modules/sass-embedded*
            '';
          };
      }
    );
}
