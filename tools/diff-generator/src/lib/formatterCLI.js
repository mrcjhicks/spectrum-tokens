/*
Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import chalk from "chalk";
import * as emoji from "node-emoji";

const yellow = chalk.hex("F3EE7E");
const red = chalk.hex("F37E7E");
const green = chalk.hex("7EF383");
const white = chalk.white;

const EMOJI = false;

export class CLIFormatter {
  get hilite() {
    return yellow;
  }
  get error() {
    return red;
  }
  get passing() {
    return green;
  }
  get neutral() {
    return white;
  }

  /**
   * Formatting helper function for indentation
   * @param {object} text - the string that needs to be indented
   * @param {object} amount - the amount of indents (x3 spaces each indent)
   * @returns {object} indented string
   */
  indent(text, amount) {
    const str = `\n${"   ".repeat(amount)}${text}`;
    return str.replace(/{|}/g, "");
  }

  /**
   * Styling for renamed tokens
   * @param {object} result - the JSON object with the report results
   * @param {object} token - the current token
   * @param {object} log - the console.log object being used
   * @param {object} i - the number of times to indent
   */
  printStyleRenamed(result, token, log, i) {
    const str =
      this.neutral(`"${result[token]["old-name"]}" -> `) +
      this.hilite(`"${token}"`);
    log(this.indent(str, i));
  }

  /**
   * Styling for deprecated tokens
   * @param {object} result - the JSON object with the report results
   * @param {object} token - the current token
   * @param {object} log - the console.log object being used
   * @param {object} i - the number of times to indent
   */
  printStyleDeprecated(result, token, log, i) {
    let comment = result[token]["deprecated_comment"];
    log(
      this.indent(
        this.hilite(`"${token}"`) +
          (typeof comment === "string" && comment.length
            ? this.neutral(": ") + this.hilite(`"${comment}"`)
            : ""),
        i,
      ),
    );
  }

  /**
   * Styling for reverted, added, and deleted tokens
   * @param {object} token - the current token
   * @param {object} color - intended color
   * @param {object} log - the console.log object being used
   */
  printStyleColored(token, color, log) {
    log(this.indent(color(`"${token}"`), 1));
  }

  /**
   * Styling for updated tokens
   * @param {object} result - the JSON object with the report results
   * @param {object} token - the current token
   * @param {object} log - the console.log object being used
   * @param {object} i - the number of times to indent
   */
  printStyleUpdated(result, token, log, i) {
    log(this.indent(this.hilite(`"${token}"`), i));
    this.printNestedChanges(result[token], log);
  }

  /**
   * General helper function for printing each category
   * @param {string} emojiName - the name of the category's emoji
   * @param {string} title - the category name
   * @param {int} numTokens - the number of tokens changed in that category
   * @param {object} result - the json object holding the report
   * @param {object} log - the console.log object being used
   * @param {object} func - the styling function that will be used
   * @param {object} colorOrIndent - can be either the intended text color or the number of times to indent
   */
  printSection(
    emojiName,
    title,
    numTokens,
    result,
    log,
    func,
    colorOrIndent,
    titleIndent = 0,
  ) {
    this.printTitle(emojiName, title, numTokens, log, titleIndent);
    Object.keys(result).forEach((token) => {
      if (typeof colorOrIndent !== "number") {
        func(token, colorOrIndent, log);
      } else {
        func(result, token, log, colorOrIndent);
      }
    });
    log("\n");
  }

  /**
   * Helper function to print and format titles/subtitles
   * @param {string} emojiName - the name of the category's emoji
   * @param {string} title - the category name
   * @param {int} numTokens - the number of tokens changed in that category
   * @param {object} log - the console.log object being used
   * @param {object} i - the number of times to indent
   */
  printTitle(emojiName, title, numTokens, log, i = 0) {
    log(
      this.indent(
        this.neutral(
          (EMOJI ? emoji.emojify(`:${emojiName}: `) : "") +
            `${title} (${numTokens})`,
        ),
        i,
      ),
    );
  }

  /**
   * Traverse through the updated token's keys and prints a simple changelog
   * @param {object} token - the updated token
   * @param {object} log - the console.log object used
   */
  printNestedChanges(token, log) {
    if (token["path"] !== undefined) {
      if (token["original-value"] === undefined) {
        this.printNewValue(token["path"], token["new-value"], log);
      } else if (token["path"].includes("$schema")) {
        this.printSchemaChange(
          token["path"],
          token["original-value"],
          token["new-value"],
          log,
        );
      } else {
        this.printValueChange(
          token["path"],
          token["original-value"],
          token["new-value"],
          log,
        );
        return;
      }
    } else {
      Object.keys(token).forEach((property) => {
        this.printNestedChanges(token[property], log);
      });
    }
  }

  printPath(path, log) {
    log(this.indent(this.hilite(path), 3));
  }

  printNewValue(path, value, log) {
    this.printPath(path, log);
    if (path.includes("$schema")) {
      log(this.indent(this.hilite(`"${value}"`), 4));
    } else {
      log(this.indent(this.hilite(`${value}`), 4));
    }
  }

  printSchemaChange(path, orginal, updated, log) {
    this.printPath(path, log);
    const newValue = updated.split("/");
    log(
      this.indent(this.neutral(`"${orginal}" -> \n`), 4) +
        this.indent(
          this.neutral(
            `"${updated.substring(0, updated.length - newValue[newValue.length - 1].length)}`,
          ) +
            this.hilite(
              `${newValue[newValue.length - 1].split(".")[0]}` +
                this.neutral(
                  `.${newValue[newValue.length - 1].split(".")[1]}"`,
                ),
            ),
          4,
        ),
    );
  }

  printValueChange(path, original, updated, log) {
    this.printPath(path, log);
    log(
      this.indent(
        this.neutral(`${original} -> `) + this.hilite(`${updated}`),
        4,
      ),
    );
  }

  /**
   * Formats and prints the report
   * @param {object} result - the updated token report
   * @param {object} log - console.log object used in previous function (don't really need this, but decided to continue using same variable)
   * @param {object} options - an array holding the values of options inputted from command line
   * @returns {int} exit code
   */
  printReport(result, log, options) {
    const totalTokens =
      Object.keys(result.renamed).length +
      Object.keys(result.deprecated).length +
      Object.keys(result.reverted).length +
      Object.keys(result.added).length +
      Object.keys(result.deleted).length +
      Object.keys(result.updated.added).length +
      Object.keys(result.updated.deleted).length +
      Object.keys(result.updated.updated).length +
      Object.keys(result.updated.renamed).length;
    log(this.neutral("\n**Tokens Changed (" + totalTokens + ")**"));
    let originalSchema = "";
    let updatedSchema = "";
    if (options.oldTokenBranch !== undefined) {
      originalSchema = this.neutral(`\n${options.oldTokenBranch} | `);
    } else if (options.oldTokenVersion !== undefined) {
      originalSchema = this.neutral(`\n${options.oldTokenVersion} | `);
    }
    if (options.newTokenBranch !== undefined) {
      updatedSchema = this.hilite(`${options.newTokenBranch}`);
    } else if (options.newTokenVersion !== undefined) {
      updatedSchema = this.hilite(`${options.newTokenVersion}`);
    }
    if (originalSchema !== "" && updatedSchema !== "") {
      log(`${originalSchema}${updatedSchema}`);
    }
    log(
      this.neutral(
        "-------------------------------------------------------------------------------------------\n",
      ),
    );
    if (Object.keys(result.renamed).length > 0) {
      this.printSection(
        "memo",
        "Renamed",
        Object.keys(result.renamed).length,
        result.renamed,
        log,
        (...args) => {
          return this.printStyleRenamed(...args);
        },
        1,
      );
    }
    if (Object.keys(result.deprecated).length > 0) {
      this.printSection(
        "clock3",
        "Newly Deprecated",
        Object.keys(result.deprecated).length,
        result.deprecated,
        log,
        (...args) => {
          return this.printStyleDeprecated(...args);
        },
        1,
      );
    }
    if (Object.keys(result.reverted).length > 0) {
      this.printSection(
        "alarm_clock",
        'Newly "Un-deprecated"',
        Object.keys(result.reverted).length,
        result.reverted,
        log,
        (...args) => {
          return this.printStyleColored(...args);
        },
        (...args) => {
          return this.hilite(...args);
        },
      );
    }
    if (Object.keys(result.added).length > 0) {
      this.printSection(
        "arrow_up_small",
        "Added",
        Object.keys(result.added).length,
        result.added,
        log,
        (...args) => {
          return this.printStyleColored(...args);
        },
        green,
      );
    }
    if (Object.keys(result.deleted).length > 0) {
      this.printSection(
        "arrow_down_small",
        "Deleted",
        Object.keys(result.deleted).length,
        result.deleted,
        log,
        (...args) => {
          return this.printStyleColored(...args);
        },
        red,
      );
    }
    const totalUpdatedTokens =
      Object.keys(result.updated.added).length +
      Object.keys(result.updated.deleted).length +
      Object.keys(result.updated.updated).length +
      Object.keys(result.updated.renamed).length;
    if (totalUpdatedTokens > 0) {
      this.printTitle("new", "Updated", totalUpdatedTokens, log);
      if (Object.keys(result.updated.renamed).length > 0) {
        this.printSection(
          "new",
          "Renamed Properties",
          Object.keys(result.updated.renamed).length,
          result.updated.renamed,
          log,
          (...args) => {
            return this.printStyleRenamed(...args);
          },
          2,
          1,
        );
      }
      if (Object.keys(result.updated.added).length > 0) {
        this.printSection(
          "new",
          "Added Properties",
          Object.keys(result.updated.added).length,
          result.updated.added,
          log,
          (...args) => {
            return this.printStyleUpdated(...args);
          },
          2,
          1,
        );
      }
      if (Object.keys(result.updated.deleted).length > 0) {
        this.printSection(
          "new",
          "Deleted Properties",
          Object.keys(result.updated.deleted).length,
          result.updated.deleted,
          log,
          (...args) => {
            return this.printStyleUpdated(...args);
          },
          2,
          1,
        );
      }
      if (Object.keys(result.updated.updated).length > 0) {
        this.printSection(
          "new",
          "Updated Properties",
          Object.keys(result.updated.updated).length,
          result.updated.updated,
          log,
          (...args) => {
            return this.printStyleUpdated(...args);
          },
          2,
          1,
        );
      }
    }

    return true;
  }
}

let formatter;

if (!formatter) formatter = new CLIFormatter();

export default formatter;
