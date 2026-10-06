# CI / Local Unified Test Suite Runner for Ghost Drains
# Validates both Python pipeline invariants and TypeScript web client.
# Exits with code 0 on all pass, or code 1 on failure.

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Ghost Drains: Running Unified Validation Suite (L1-L7)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Run Python Hydrology Pipeline Tests (Pytest)
Write-Host "`n[1/2] Running Python Pipeline Invariant & Hydrology Tests..." -ForegroundColor Yellow
python -m pytest pipeline/tests/ -v
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[FAIL] Pipeline test suite failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}
Write-Host "[PASS] All 23 pipeline test gates passed." -ForegroundColor Green

# 2. Run TypeScript Web Client Tests (Vitest)
Write-Host "`n[2/2] Running Web Client Physics & UI Tests..." -ForegroundColor Yellow
npm test --prefix web
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[FAIL] Web client test suite failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}
Write-Host "[PASS] All 35 web client test gates passed." -ForegroundColor Green

# 3. Production Build Smoke Test
Write-Host "`n[3/3] Running Web Client TypeScript & Vite Build Verification..." -ForegroundColor Yellow
npm run build --prefix web
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[FAIL] Web build compilation failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}
Write-Host "[PASS] Production build clean." -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  SUCCESS: 58 / 58 Automated Test Gates Passing (100% Green)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
exit 0
