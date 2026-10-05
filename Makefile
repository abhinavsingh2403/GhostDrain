.PHONY: pipeline test-pipeline test-web test dev build clean

pipeline:
	cd pipeline && python -m p01_fetch
	cd pipeline && python -m p02_clip_reproject
	cd pipeline && python -m p03_condition
	cd pipeline && python -m p04_flow
	cd pipeline && python -m p05_hand
	cd pipeline && python -m p06_vectors
	cd pipeline && python -m p07_resample
	cd pipeline && python -m p08_package

test-pipeline:
	cd pipeline && python -m pytest tests/ -v

test-web:
	cd web && npm test

test: test-pipeline test-web

dev:
	cd web && npm run dev

build:
	cd web && npm run build

clean:
	rm -rf data/interim/* data/processed/* web/public/data/*.bin web/public/data/*.json
