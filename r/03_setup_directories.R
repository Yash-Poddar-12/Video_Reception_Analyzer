# Create all required directories
directories <- c(
    "r",
    "r/utils",
    "models",
    "data/raw",
    "data/processed",
    "visuals",
    "powerbi",
    "backend",
    "backend/routes",
    "backend/middleware",
    "frontend",
    "frontend/app",
    "frontend/app/dashboard",
    "frontend/app/sign-in",
    "frontend/app/sign-up",
    "frontend/components",
    "logs",
    "tmp"
)

for (dir in directories) {
    dir.create(dir, recursive = TRUE, showWarnings = FALSE)
    cat("Created:", dir, "\n")
}
