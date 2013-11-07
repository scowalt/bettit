SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

CREATE SCHEMA IF NOT EXISTS `test` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci ;
USE `test` ;

-- -----------------------------------------------------
-- Table `test`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `test`.`users` (
  `username` VARCHAR(20) NOT NULL,
  `money` BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`username`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `test`.`threads`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `test`.`threads` (
  `thread_id` VARCHAR(10) NOT NULL,
  `title` VARCHAR(300) NOT NULL,
  `content` VARCHAR(10000) NOT NULL,
  `original_poster` VARCHAR(20) NOT NULL,
  `subreddit` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`thread_id`),
  UNIQUE INDEX `thread_id_UNIQUE` (`thread_id` ASC),
  INDEX `fk_threads_users1_idx` (`original_poster` ASC),
  CONSTRAINT `fk_threads_users1`
    FOREIGN KEY (`original_poster`)
    REFERENCES `test`.`users` (`username`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `test`.`events`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `test`.`events` (
  `event_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL,
  `thread_id` VARCHAR(10) NOT NULL,
  `status` TINYINT(3) UNSIGNED NOT NULL DEFAULT 0,
  `creator` VARCHAR(20) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`, `thread_id`, `creator`),
  UNIQUE INDEX `event_id_UNIQUE` (`event_id` ASC),
  INDEX `fk_events_threads1_idx` (`thread_id` ASC),
  INDEX `fk_events_users1_idx` (`creator` ASC),
  CONSTRAINT `fk_events_threads1`
    FOREIGN KEY (`thread_id`)
    REFERENCES `test`.`threads` (`thread_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_events_users1`
    FOREIGN KEY (`creator`)
    REFERENCES `test`.`users` (`username`)
    ON DELETE NO ACTION
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `test`.`outcomes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `test`.`outcomes` (
  `outcome_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(300) NOT NULL,
  `event_id` BIGINT UNSIGNED NOT NULL,
  `thread_id` VARCHAR(10) NOT NULL,
  `winner` TINYINT(1) UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (`outcome_id`, `event_id`, `thread_id`),
  UNIQUE INDEX `outcome_id_UNIQUE` (`outcome_id` ASC),
  INDEX `fk_outcomes_events1_idx` (`event_id` ASC, `thread_id` ASC),
  CONSTRAINT `fk_outcomes_events1`
    FOREIGN KEY (`event_id` , `thread_id`)
    REFERENCES `test`.`events` (`event_id` , `thread_id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `test`.`bets`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `test`.`bets` (
  `username` VARCHAR(20) NOT NULL,
  `outcome_id` BIGINT UNSIGNED NOT NULL,
  `event_id` BIGINT UNSIGNED NOT NULL,
  `thread_id` VARCHAR(10) NOT NULL,
  `amount` BIGINT UNSIGNED NOT NULL DEFAULT 20,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`username`, `outcome_id`, `event_id`, `thread_id`),
  INDEX `fk_users_has_outcomes_outcomes1_idx` (`outcome_id` ASC, `event_id` ASC, `thread_id` ASC),
  INDEX `fk_users_has_outcomes_users1_idx` (`username` ASC),
  CONSTRAINT `fk_users_has_outcomes_users1`
    FOREIGN KEY (`username`)
    REFERENCES `test`.`users` (`username`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_users_has_outcomes_outcomes1`
    FOREIGN KEY (`outcome_id` , `event_id` , `thread_id`)
    REFERENCES `test`.`outcomes` (`outcome_id` , `event_id` , `thread_id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `test`.`users_moderate_threads`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `test`.`users_moderate_threads` (
  `username` VARCHAR(20) NOT NULL,
  `thread_id` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`username`, `thread_id`),
  INDEX `fk_users_has_threads_threads1_idx` (`thread_id` ASC),
  INDEX `fk_users_has_threads_users1_idx` (`username` ASC),
  CONSTRAINT `fk_users_has_threads_users1`
    FOREIGN KEY (`username`)
    REFERENCES `test`.`users` (`username`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_users_has_threads_threads1`
    FOREIGN KEY (`thread_id`)
    REFERENCES `test`.`threads` (`thread_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

CREATE USER 'bettit' IDENTIFIED BY 'phAwupe9hA2RaWeb';

GRANT ALTER, DELETE, INSERT, SELECT, UPDATE, LOCK TABLES ON TABLE test.* TO 'bettit';
CREATE USER 'root' IDENTIFIED BY 'yertorpseryish';

GRANT ALL ON `test`.* TO 'root';

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
