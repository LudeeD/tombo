ifneq ("$(wildcard .env)","")
  include .env     # treat .env as just another Makefile fragment
  export           # export every variable we just loaded
endif

ifndef DEPLOY_HOOK_URL
  $(error DEPLOY_HOOK_URL is not set; add it to .env or export it before running make)
endif

.PHONY: deploy

deploy:
	@echo "➤ Building Tailwind CSS"
	npx @tailwindcss/cli -i ./src/input.css -o ./src/public/style.css

	@echo "➤ Running cargo sqlx prepare"
	cargo sqlx prepare

	@echo "➤ Committing all changes"
	git add .
	git commit -m "chore: release $(shell date +%Y-%m-%d)"

	@echo "➤ Pushing to upstream"
	git push

	@echo "➤ Notifying deploy hook"
	curl -sf -X POST "$(DEPLOY_HOOK_URL)"
