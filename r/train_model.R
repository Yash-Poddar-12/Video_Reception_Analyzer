#!/usr/bin/env Rscript
# ==============================================================================
# train_model.R - Tube-Senti Model Training Script
# ==============================================================================

library(e1071)
library(caret)
library(tm)
library(dplyr)
library(ggplot2)
library(glmnet)

# Ensure directories exist
dir.create("models", showWarnings = FALSE)
dir.create("visuals", showWarnings = FALSE)

set.seed(42)

cat("=== Tube-Senti Model Training ===\n")
cat("Started at:", as.character(Sys.time()), "\n\n")

# 1. LOAD DATA
cat("Step 1: Loading preprocessed data...\n")
metadata <- read.csv("data/processed/reviews_clean.csv", stringsAsFactors = FALSE)
dtm <- readRDS("data/processed/dtm.rds")
dtm_df <- as.data.frame(as.matrix(dtm))
stopifnot(nrow(metadata) == nrow(dtm_df))

data <- cbind(metadata, dtm_df)
data$sentiment <- as.factor(data$sentiment)

cat("  Loaded", nrow(metadata), "documents\n")
cat("  Class distribution:\n")
print(table(data$sentiment))

# 2. TRAIN-TEST SPLIT
cat("\nStep 2: Creating 80/20 stratified split...\n")
train_index <- createDataPartition(data$sentiment, p = 0.8, list = FALSE, times = 1)
train_data <- data[train_index, ]
test_data <- data[-train_index, ]

metadata_cols <- c("doc_id", "sentiment", "word_count", "char_count")
feature_cols <- setdiff(names(data), metadata_cols)

X_train <- train_data[, feature_cols]
y_train <- train_data$sentiment
X_test <- test_data[, feature_cols]
y_test <- test_data$sentiment

cat("  Training samples:", nrow(X_train), "\n")
cat("  Test samples:", nrow(X_test), "\n")
cat("  Features:", ncol(X_train), "\n")

# 3. TRAIN NAIVE BAYES MODEL
cat("\nStep 3: Training Naive Bayes classifier...\n")
train_df <- cbind(X_train, sentiment = y_train)

start_time <- Sys.time()
nb_model <- naiveBayes(sentiment ~ ., data = train_df, laplace = 1)
end_time <- Sys.time()
training_time <- as.numeric(difftime(end_time, start_time, units = "secs"))
cat("  Training completed in", round(training_time, 2), "seconds\n")

# 4. EVALUATE MODEL
cat("\nStep 4: Evaluating model performance...\n")
y_pred <- predict(nb_model, X_test, type = "class")
y_prob <- predict(nb_model, X_test, type = "raw")

conf_matrix <- confusionMatrix(y_pred, y_test, positive = "positive")
accuracy <- conf_matrix$overall["Accuracy"]

cat("  Overall Accuracy:", round(accuracy * 100, 2), "%\n")

calculate_f1 <- function(conf_matrix, positive_class) {
    cm <- conf_matrix$table
    if (positive_class == "positive") {
        TP <- cm["positive", "positive"]
        FP <- cm["positive", "negative"]
        FN <- cm["negative", "positive"]
    } else {
        TP <- cm["negative", "negative"]
        FP <- cm["negative", "positive"]
        FN <- cm["positive", "negative"]
    }
    precision <- TP / (TP + FP)
    recall <- TP / (TP + FN)
    f1 <- 2 * (precision * recall) / (precision + recall)
    return(list(precision = precision, recall = recall, f1 = f1))
}
pos_metrics <- calculate_f1(conf_matrix, "positive")
neg_metrics <- calculate_f1(conf_matrix, "negative")
macro_f1 <- (pos_metrics$f1 + neg_metrics$f1) / 2

cat("  Macro-Averaged F1-Score:", round(macro_f1, 4), "\n")

confusion_df <- as.data.frame(conf_matrix$table)
names(confusion_df) <- c("Predicted", "Actual", "Count")

p <- ggplot(confusion_df, aes(x = Actual, y = Predicted, fill = Count)) +
    geom_tile() +
    geom_text(aes(label = Count), size = 8, color = "white") +
    scale_fill_gradient(low = "lightblue", high = "darkblue") +
    labs(
        title = "Naive Bayes Confusion Matrix",
        subtitle = "Stanford Large Movie Dataset (Test Set)",
        x = "Actual Class",
        y = "Predicted Class"
    ) +
    theme_minimal() +
    theme(
        plot.title = element_text(hjust = 0.5, size = 16, face = "bold"),
        plot.subtitle = element_text(hjust = 0.5)
    )

ggsave("visuals/confusion_matrix.png", p, width = 8, height = 6, dpi = 300)
cat("  Saved visuals/confusion_matrix.png\n")


# 5. LOGISTIC REGRESSION COMPARISON
cat("\nStep 5: Logistic Regression Comparison...\n")
lr_start_time <- Sys.time()
X_train_matrix <- as.matrix(X_train)
X_test_matrix <- as.matrix(X_test)
y_train_numeric <- as.numeric(y_train == "positive")

lr_model <- cv.glmnet(
    X_train_matrix, 
    y_train_numeric, 
    family = "binomial",
    alpha = 0,
    nfolds = 5
)
lr_end_time <- Sys.time()
lr_training_time <- as.numeric(difftime(lr_end_time, lr_start_time, units = "secs"))

lr_prob <- predict(lr_model, X_test_matrix, s = "lambda.min", type = "response")
lr_pred <- ifelse(lr_prob > 0.5, "positive", "negative")
lr_pred <- factor(lr_pred, levels = c("negative", "positive"))

lr_conf_matrix <- confusionMatrix(lr_pred, y_test, positive = "positive")
lr_accuracy <- lr_conf_matrix$overall["Accuracy"]

lr_pos_metrics <- calculate_f1(lr_conf_matrix, "positive")
lr_neg_metrics <- calculate_f1(lr_conf_matrix, "negative")
lr_macro_f1 <- (lr_pos_metrics$f1 + lr_neg_metrics$f1) / 2

speed_ratio <- lr_training_time / training_time

cat("  Speed ratio (LR/NB):", round(speed_ratio, 1), "\n")

comparison <- data.frame(
    Model = c("Naive Bayes", "Logistic Regression"),
    Accuracy = c(
        round(accuracy * 100, 2),
        round(lr_accuracy * 100, 2)
    ),
    F1_Score = c(
        round(macro_f1, 2),
        round(lr_macro_f1, 2)
    ),
    Training_Time_Sec = c(
        round(training_time, 2),
        round(lr_training_time, 2)
    )
)

comparison_long <- data.frame(
    Model = rep(c("Naive Bayes", "Logistic Regression"), 3),
    Metric = rep(c("Accuracy (%)", "F1-Score", "Training Time (s)"), each = 2),
    Value = c(
        round(accuracy * 100, 1), round(lr_accuracy * 100, 1),
        round(macro_f1, 2), round(lr_macro_f1, 2),
        training_time, lr_training_time
    )
)

p1 <- ggplot(comparison_long[comparison_long$Metric != "Training Time (s)", ], 
             aes(x = Metric, y = Value, fill = Model)) +
    geom_bar(stat = "identity", position = "dodge", width = 0.7) +
    geom_text(aes(label = Value), position = position_dodge(width = 0.7), 
              vjust = -0.5, size = 4) +
    scale_fill_manual(values = c("Naive Bayes" = "#3498db", "Logistic Regression" = "#e74c3c")) +
    labs(
        title = "Model Performance Comparison",
        subtitle = "Naive Bayes vs Logistic Regression on Stanford Movie Dataset",
        y = "Score"
    ) +
    theme_minimal() +
    theme(
        plot.title = element_text(hjust = 0.5, size = 14, face = "bold"),
        legend.position = "bottom"
    ) +
    ylim(0, 100)

ggsave("visuals/model_comparison_performance.png", p1, width = 10, height = 6, dpi = 300)

p2 <- ggplot(comparison, aes(x = Model, y = Training_Time_Sec, fill = Model)) +
    geom_bar(stat = "identity", width = 0.5) +
    geom_text(aes(label = paste0(round(Training_Time_Sec, 2), "s")), vjust = -0.5, size = 5) +
    scale_fill_manual(values = c("Naive Bayes" = "#3498db", "Logistic Regression" = "#e74c3c")) +
    labs(
        title = "Training Time Comparison",
        subtitle = paste0("Naive Bayes is ", round(speed_ratio, 1), "x faster"),
        y = "Training Time (seconds)"
    ) +
    theme_minimal() +
    theme(
        plot.title = element_text(hjust = 0.5, size = 14, face = "bold"),
        legend.position = "none"
    )

ggsave("visuals/model_comparison_time.png", p2, width = 8, height = 6, dpi = 300)
cat("  Saved model comparison charts\n")

# 6. SERIALIZE MODEL
cat("\nStep 6: Serializing model...\n")
saveRDS(nb_model, "models/nb_model.rds")
cat("  Saved models/nb_model.rds\n")

training_metadata <- list(
    model_type = "Naive Bayes (e1071::naiveBayes)",
    training_date = Sys.time(),
    training_samples = nrow(X_train),
    test_samples = nrow(X_test),
    vocabulary_size = ncol(X_train),
    accuracy = as.numeric(accuracy),
    macro_f1 = macro_f1,
    training_time_seconds = training_time,
    dataset = "Stanford Large Movie Review Dataset",
    laplace_smoothing = 1,
    random_seed = 42
)
saveRDS(training_metadata, "models/training_metadata.rds")
cat("  Saved models/training_metadata.rds\n")
