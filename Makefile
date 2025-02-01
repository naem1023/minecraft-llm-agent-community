SHELL = bash

.ONESHELL:
install:
	uv sync --no-install-project --inexact


.ONESHELL:
pre-commit-install:
	uv run pre-commit install

.ONESHELL:
lint:
	uv run --only-group dev ruff check --fix .
	uv run --only-group dev ruff format .
