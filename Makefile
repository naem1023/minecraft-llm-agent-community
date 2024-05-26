SHELL = bash

.PHONY: install pre-commit

.ONESHELL:
install:
	pip install poetry
	poetry install --with dev --no-root

.ONESHELL:
pre-commit:
	# pre-commit
	git ls-files | xargs pre-commit run -c .conf/.pre-commit-config.yaml --verbose --file
