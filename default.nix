{ nixpkgs ? import <nixpkgs> {} }:

with nixpkgs;

mkShell {
  buildInputs = [
    # node runtime.
    nodejs-10_x

    # for compiling optipng, gifsicle and jpegtran
    # autoconf zlib nasm automake

    optipng
    gifsicle
    libjpeg  # for jpegtran
  ];
}
