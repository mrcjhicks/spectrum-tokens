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

import { CLIFormatter } from "./formatterCLI.js";

class MarkdownFormatter extends CLIFormatter {
  get hilite() {
    return function (input) {
      return "<code>" + input + "</code>";
    };
  }
  get error() {
    return function (input) {
      return "<strong>" + input + "</strong>";
    };
  }
  get passing() {
    return function (input) {
      return input;
    };
  }
  get neutral() {
    return function (input) {
      return input;
    };
  }

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
    log("<details open><summary>");
    this.printTitle(emojiName, title, numTokens, log, titleIndent);
    log("</summary>");
    Object.keys(result).forEach((token) => {
      if (typeof colorOrIndent !== "number") {
        func(token, colorOrIndent, log);
      } else {
        func(result, token, log, colorOrIndent);
      }
    });
    log("</details>");
  }

  indent(text, amount) {
    const str = `${"&ensp;&ensp;&ensp;".repeat(amount)}${text}<br />`;
    return str.replace(/{|}/g, "");
  }

  printStyleColored(token, color, log) {
    log(this.indent(this.hilite(token), 1));
  }

  printStyleRenamed(result, token, log, i) {
    const str =
      this.neutral(result[token]["old-name"] + " -> ") + this.hilite(token);
    log(this.indent(str, i));
  }

  printStyleDeprecated(result, token, log, i) {
    let comment = result[token]["deprecated_comment"];
    log(
      this.indent(
        this.hilite(token) +
          (typeof comment === "string" && comment.length
            ? this.neutral(": " + comment)
            : ""),
        i,
      ),
    );
  }

  printStyleUpdated(result, token, log, i) {
    log(this.indent(this.hilite(token), i));
    this.printNestedChanges(result[token], log);
  }

  printNewValue(path, value, log) {
    log(
      this.indent(this.neutral(path.replaceAll("sets.", "") + ": " + value), 3),
    );
  }

  printSchemaChange(path, orginal, updated, log) {
    log(
      this.indent(
        this.neutral(
          path.replace("sets.", "").replace("$", "") +
            ": " +
            orginal.split("/").pop() +
            " -> " +
            updated.split("/").pop(),
        ),
        3,
      ),
    );
  }

  printValueChange(path, original, updated, log) {
    log(
      this.indent(
        this.neutral(
          path.replace("sets.", "") + ": " + original + " -> " + updated,
        ),
        3,
      ),
    );
  }
}

let formatter;

if (!formatter) formatter = new MarkdownFormatter();

export default formatter;
