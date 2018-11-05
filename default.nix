{ nixpkgs ? import <nixpkgs> {} }:

with nixpkgs;

let

  node10 = nodejs-10_x;
  yarn10 = yarn.override {
    nodejs = node10;
  };

in

mkShell {
  buildInputs = [
    # node runtime.
    node10
    yarn10

    # for compiling optipng, gifsicle and jpegtran
    # autoconf zlib nasm automake

    optipng
    gifsicle
    libjpeg  # for jpegtran
  ];
}
