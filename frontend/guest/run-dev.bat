@echo off
REM Run guest dev server from short path (fixes esbuild "service is no longer running" on Windows when path has spaces)
set "GUEST=%~dp0"
set "GUEST=%GUEST:~0,-1%"

for %%I in ("%GUEST%") do set "SHORT=%%~sI"
if defined SHORT (
  cd /d "%SHORT%"
  echo [Guest] Using short path to avoid spaces: %SHORT%
)

npm run dev
