import globals from "globals";
import pluginJs from "@eslint/js";
import prettier from "eslint-config-prettier";
import pluginPrettier from "eslint-plugin-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
    { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
    { languageOptions: { globals: globals.browser } },

    // ESLint 기본 추천 설정
    pluginJs.configs.recommended,

    // Prettier 설정 추가
    prettier,
    {
        plugins: { prettier: pluginPrettier },
        rules: {
            "prettier/prettier": "error", // Prettier 스타일 강제 적용
            semi: ["error", "always"], // 세미콜론 자동 추가
            indent: ["error", 2], // 들여쓰기 2칸 적용
            quotes: ["error", "double"], // 큰따옴표 적용
            eqeqeq: ["error", "always"], // 일치 연산자 강제 적용
        },
    },
];
