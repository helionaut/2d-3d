export type GraphMode = '2d' | '3d'

export type ExpressionValidationErrorCode =
  | 'empty-expression'
  | 'multi-line-expression'
  | 'unsupported-dependent-variable-prefix'
  | 'disallowed-variable-for-mode'
  | 'unknown-identifier'
  | 'invalid-parameter-id'
  | 'reserved-parameter-id'
  | 'invalid-parameter-value'
  | 'unsupported-function'
  | 'wrong-function-arity'
  | 'implicit-multiplication'
  | 'mismatched-parentheses'
  | 'malformed-numeric-literal'
  | 'unexpected-token'

export interface ExpressionValidationError {
  code: ExpressionValidationErrorCode
  message: string
  start: number
  end: number
}

interface NumberLiteralNode {
  kind: 'number'
  value: number
}

interface ConstantNode {
  kind: 'constant'
  name: 'pi' | 'e'
}

interface VariableNode {
  kind: 'variable'
  name: 'x' | 'y'
}

interface ParameterNode {
  kind: 'parameter'
  name: string
}

interface UnaryNode {
  kind: 'unary'
  operator: '+' | '-'
  operand: ExpressionAst
}

interface BinaryNode {
  kind: 'binary'
  operator: '+' | '-' | '*' | '/' | '^'
  left: ExpressionAst
  right: ExpressionAst
}

interface CallNode {
  kind: 'call'
  name: SupportedFunctionName
  arguments: ExpressionAst[]
}

export type ExpressionAst =
  | NumberLiteralNode
  | ConstantNode
  | VariableNode
  | ParameterNode
  | UnaryNode
  | BinaryNode
  | CallNode

export interface ExpressionValidationSuccess {
  ok: true
  mode: GraphMode
  rawInput: string
  normalizedExpression: string
  parameterValues: Record<string, number>
  referencedParameters: string[]
  ast: ExpressionAst
}

export interface ExpressionValidationFailure {
  ok: false
  mode: GraphMode
  rawInput: string
  normalizedExpression: string | null
  error: ExpressionValidationError
}

export type ExpressionValidationResult =
  | ExpressionValidationSuccess
  | ExpressionValidationFailure

export type NormalizationResult =
  | {
      ok: true
      normalizedExpression: string
    }
  | {
      ok: false
      error: ExpressionValidationError
    }

export const MODE_DEFINITIONS: Record<
  GraphMode,
  {
    label: '2D' | '3D'
    buttonLabel: string
    dependentVariable: 'y' | 'z'
    variables: readonly ('x' | 'y')[]
    exampleInput: string
    description: string
  }
> = {
  '2d': {
    label: '2D',
    buttonLabel: '2D curve',
    dependentVariable: 'y',
    variables: ['x'],
    exampleInput: 'y = sin(x)',
    description: 'Plot y = f(x) against visible Cartesian axes.',
  },
  '3d': {
    label: '3D',
    buttonLabel: '3D surface',
    dependentVariable: 'z',
    variables: ['x', 'y'],
    exampleInput: 'z = sin(x) * cos(y)',
    description: 'Plot z = f(x, y) as an interactive surface.',
  },
}

export const SUPPORTED_CONSTANTS = ['pi', 'e'] as const

const unaryFunctions = [
  'abs',
  'acos',
  'asin',
  'atan',
  'ceil',
  'cos',
  'cosh',
  'exp',
  'floor',
  'ln',
  'log10',
  'round',
  'sign',
  'sin',
  'sinh',
  'sqrt',
  'tan',
  'tanh',
] as const

const binaryFunctions = ['atan2', 'max', 'min'] as const

export const SUPPORTED_FUNCTION_REFERENCE = [
  ...unaryFunctions,
  ...binaryFunctions,
] as const

type SupportedFunctionName = (typeof SUPPORTED_FUNCTION_REFERENCE)[number]

const FUNCTION_ARITY = new Map<SupportedFunctionName, 1 | 2>([
  ...unaryFunctions.map((name) => [name, 1] as const),
  ...binaryFunctions.map((name) => [name, 2] as const),
])

const RESERVED_IDENTIFIERS = new Set<string>([
  ...SUPPORTED_CONSTANTS,
  ...SUPPORTED_FUNCTION_REFERENCE,
  'x',
  'y',
  'z',
])

const PARAMETER_ID_PATTERN = /^[a-z][a-z0-9_]*$/

type TokenType =
  | 'number'
  | 'identifier'
  | 'plus'
  | 'minus'
  | 'star'
  | 'slash'
  | 'caret'
  | 'lparen'
  | 'rparen'
  | 'comma'
  | 'eof'

interface Token {
  type: TokenType
  lexeme: string
  start: number
  end: number
}

const tokenTypesBySymbol = {
  '+': 'plus',
  '-': 'minus',
  '*': 'star',
  '/': 'slash',
  '^': 'caret',
  '(': 'lparen',
  ')': 'rparen',
  ',': 'comma',
} satisfies Record<string, TokenType>

class ParserError extends Error {
  failure: ExpressionValidationFailure

  constructor(failure: ExpressionValidationFailure) {
    super(failure.error.message)
    this.failure = failure
  }
}

export function normalizeExpressionInput({
  mode,
  rawInput,
}: {
  mode: GraphMode
  rawInput: string
}): NormalizationResult {
  if (rawInput.includes('\n') || rawInput.includes('\r')) {
    return {
      ok: false,
      error: createError(
        'multi-line-expression',
        'Formulas must stay on a single line.',
        0,
        rawInput.length || 1,
      ),
    }
  }

  const trimmedInput = rawInput.trim()

  if (!trimmedInput) {
    return {
      ok: false,
      error: createError('empty-expression', 'Enter a formula to plot.', 0, 0),
    }
  }

  const equalsIndex = trimmedInput.indexOf('=')
  if (equalsIndex === -1) {
    return {
      ok: true,
      normalizedExpression: trimmedInput,
    }
  }

  const leftHandSide = trimmedInput.slice(0, equalsIndex).trim()
  const rightHandSide = trimmedInput.slice(equalsIndex + 1).trim()
  const expectedDependentVariable = MODE_DEFINITIONS[mode].dependentVariable

  if (leftHandSide !== expectedDependentVariable) {
    return {
      ok: false,
      error: createError(
        'unsupported-dependent-variable-prefix',
        `Use \`${expectedDependentVariable} =\` in ${MODE_DEFINITIONS[mode].label} mode or omit the prefix.`,
        0,
        leftHandSide.length || trimmedInput.length,
      ),
    }
  }

  if (!rightHandSide) {
    return {
      ok: false,
      error: createError(
        'empty-expression',
        'Enter a formula to plot.',
        equalsIndex + 1,
        equalsIndex + 1,
      ),
    }
  }

  return {
    ok: true,
    normalizedExpression: rightHandSide,
  }
}

export function validateExpressionInput({
  mode,
  rawInput,
  parameterValues = {},
}: {
  mode: GraphMode
  rawInput: string
  parameterValues?: Record<string, unknown>
}): ExpressionValidationResult {
  const normalized = normalizeExpressionInput({ mode, rawInput })
  if (!normalized.ok) {
    return {
      ok: false,
      mode,
      rawInput,
      normalizedExpression: null,
      error: normalized.error,
    }
  }

  const validatedParameters = validateParameterValues({
    mode,
    rawInput,
    normalizedExpression: normalized.normalizedExpression,
    parameterValues,
  })

  if (!validatedParameters.ok) {
    return validatedParameters
  }

  try {
    const parser = new ExpressionParser({
      mode,
      rawInput,
      normalizedExpression: normalized.normalizedExpression,
      parameterValues: validatedParameters.parameterValues,
    })
    return parser.parse()
  } catch (error) {
    if (error instanceof ParserError) {
      return error.failure
    }

    throw error
  }
}

export function evaluateExpressionAst(
  ast: ExpressionAst,
  scope: {
    x: number
    y?: number
    parameterValues: Record<string, number>
  },
): number {
  switch (ast.kind) {
    case 'number':
      return ast.value
    case 'constant':
      return ast.name === 'pi' ? Math.PI : Math.E
    case 'variable':
      return ast.name === 'x' ? scope.x : scope.y ?? 0
    case 'parameter':
      return scope.parameterValues[ast.name]
    case 'unary': {
      const operand = evaluateExpressionAst(ast.operand, scope)
      return ast.operator === '-' ? -operand : operand
    }
    case 'binary': {
      const left = evaluateExpressionAst(ast.left, scope)
      const right = evaluateExpressionAst(ast.right, scope)

      switch (ast.operator) {
        case '+':
          return left + right
        case '-':
          return left - right
        case '*':
          return left * right
        case '/':
          return left / right
        case '^':
          return left ** right
      }

      throw new Error('Unsupported binary operator.')
    }
    case 'call':
      return evaluateFunction(ast.name, ast.arguments, scope)
  }
}

function evaluateFunction(
  name: SupportedFunctionName,
  args: ExpressionAst[],
  scope: {
    x: number
    y?: number
    parameterValues: Record<string, number>
  },
): number {
  const values = args.map((argument) => evaluateExpressionAst(argument, scope))

  switch (name) {
    case 'abs':
      return Math.abs(values[0])
    case 'acos':
      return Math.acos(values[0])
    case 'asin':
      return Math.asin(values[0])
    case 'atan':
      return Math.atan(values[0])
    case 'atan2':
      return Math.atan2(values[0], values[1])
    case 'ceil':
      return Math.ceil(values[0])
    case 'cos':
      return Math.cos(values[0])
    case 'cosh':
      return Math.cosh(values[0])
    case 'exp':
      return Math.exp(values[0])
    case 'floor':
      return Math.floor(values[0])
    case 'ln':
      return Math.log(values[0])
    case 'log10':
      return Math.log10(values[0])
    case 'max':
      return Math.max(values[0], values[1])
    case 'min':
      return Math.min(values[0], values[1])
    case 'round':
      return Math.round(values[0])
    case 'sign':
      return Math.sign(values[0])
    case 'sin':
      return Math.sin(values[0])
    case 'sinh':
      return Math.sinh(values[0])
    case 'sqrt':
      return Math.sqrt(values[0])
    case 'tan':
      return Math.tan(values[0])
    case 'tanh':
      return Math.tanh(values[0])
  }
}

function validateParameterValues({
  mode,
  rawInput,
  normalizedExpression,
  parameterValues,
}: {
  mode: GraphMode
  rawInput: string
  normalizedExpression: string
  parameterValues: Record<string, unknown>
}):
  | ExpressionValidationSuccess
  | {
      ok: true
      parameterValues: Record<string, number>
    }
  | ExpressionValidationFailure {
  const validatedEntries: [string, number][] = []

  for (const [parameterId, value] of Object.entries(parameterValues)) {
    if (!PARAMETER_ID_PATTERN.test(parameterId)) {
      return createFailure({
        code: 'invalid-parameter-id',
        message: `Parameter id "${parameterId}" must match ${PARAMETER_ID_PATTERN}.`,
        mode,
        rawInput,
        normalizedExpression,
        start: 0,
        end: parameterId.length || 1,
      })
    }

    if (RESERVED_IDENTIFIERS.has(parameterId)) {
      return createFailure({
        code: 'reserved-parameter-id',
        message: `Parameter id "${parameterId}" is reserved.`,
        mode,
        rawInput,
        normalizedExpression,
        start: 0,
        end: parameterId.length || 1,
      })
    }

    if (!isFiniteNumber(value)) {
      return createFailure({
        code: 'invalid-parameter-value',
        message: `Parameter "${parameterId}" must be a finite number.`,
        mode,
        rawInput,
        normalizedExpression,
        start: 0,
        end: parameterId.length || 1,
      })
    }

    validatedEntries.push([parameterId, value])
  }

  return {
    ok: true,
    parameterValues: Object.fromEntries(validatedEntries),
  }
}

class ExpressionParser {
  private readonly mode: GraphMode
  private readonly rawInput: string
  private readonly normalizedExpression: string
  private readonly parameterValues: Record<string, number>
  private readonly allowedVariables: Set<string>
  private readonly tokens: Token[]
  private readonly referencedParameters = new Set<string>()
  private index = 0

  constructor({
    mode,
    rawInput,
    normalizedExpression,
    parameterValues,
  }: {
    mode: GraphMode
    rawInput: string
    normalizedExpression: string
    parameterValues: Record<string, number>
  }) {
    this.mode = mode
    this.rawInput = rawInput
    this.normalizedExpression = normalizedExpression
    this.parameterValues = parameterValues
    this.allowedVariables = new Set(MODE_DEFINITIONS[mode].variables)
    this.tokens = tokenize({
      mode,
      rawInput,
      normalizedExpression,
    })
  }

  parse(): ExpressionValidationSuccess {
    const ast = this.parseExpression()

    if (this.current().type === 'rparen') {
      this.fail(
        'mismatched-parentheses',
        'Check that every opening parenthesis has a matching closing parenthesis.',
        this.current(),
      )
    }

    if (startsPrimary(this.current())) {
      this.fail(
        'implicit-multiplication',
        'Insert * between adjacent terms; implicit multiplication is not supported.',
        this.current(),
      )
    }

    if (this.current().type !== 'eof') {
      this.fail(
        'unexpected-token',
        `Unsupported token "${this.current().lexeme}" in the formula.`,
        this.current(),
      )
    }

    return {
      ok: true,
      mode: this.mode,
      rawInput: this.rawInput,
      normalizedExpression: this.normalizedExpression,
      parameterValues: this.parameterValues,
      referencedParameters: [...this.referencedParameters].sort(),
      ast,
    }
  }

  private parseExpression(): ExpressionAst {
    return this.parseSum()
  }

  private parseSum(): ExpressionAst {
    let expression = this.parseProduct()

    while (this.current().type === 'plus' || this.current().type === 'minus') {
      const operatorToken = this.advance()
      const right = this.parseProduct()
      expression = {
        kind: 'binary',
        operator: operatorToken.lexeme as BinaryNode['operator'],
        left: expression,
        right,
      }
    }

    return expression
  }

  private parseProduct(): ExpressionAst {
    let expression = this.parsePower()

    while (this.current().type === 'star' || this.current().type === 'slash') {
      const operatorToken = this.advance()
      const right = this.parsePower()
      expression = {
        kind: 'binary',
        operator: operatorToken.lexeme as BinaryNode['operator'],
        left: expression,
        right,
      }
    }

    if (startsPrimary(this.current())) {
      this.fail(
        'implicit-multiplication',
        'Insert * between adjacent terms; implicit multiplication is not supported.',
        this.current(),
      )
    }

    return expression
  }

  private parsePower(): ExpressionAst {
    let expression = this.parseUnary()

    while (this.current().type === 'caret') {
      this.advance()
      const right = this.parseUnary()
      expression = {
        kind: 'binary',
        operator: '^',
        left: expression,
        right,
      }
    }

    return expression
  }

  private parseUnary(): ExpressionAst {
    if (this.current().type === 'plus' || this.current().type === 'minus') {
      const operatorToken = this.advance()

      return {
        kind: 'unary',
        operator: operatorToken.lexeme as UnaryNode['operator'],
        operand: this.parsePrimary(),
      }
    }

    return this.parsePrimary()
  }

  private parsePrimary(): ExpressionAst {
    const token = this.current()

    if (token.type === 'number') {
      this.advance()
      return {
        kind: 'number',
        value: Number(token.lexeme),
      }
    }

    if (token.type === 'identifier') {
      this.advance()
      return this.parseIdentifier(token)
    }

    if (token.type === 'lparen') {
      this.advance()
      const expression = this.parseExpression()

      if (this.current().type !== 'rparen') {
        this.fail(
          'mismatched-parentheses',
          'Check that every opening parenthesis has a matching closing parenthesis.',
          token,
        )
      }

      this.advance()
      return expression
    }

    if (token.type === 'rparen') {
      this.fail(
        'mismatched-parentheses',
        'Check that every opening parenthesis has a matching closing parenthesis.',
        token,
      )
    }

    this.fail(
      'unexpected-token',
      `Unsupported token "${token.lexeme}" in the formula.`,
      token,
    )
  }

  private parseIdentifier(identifierToken: Token): ExpressionAst {
    if (this.current().type === 'lparen') {
      return this.parseCall(identifierToken)
    }

    if (identifierToken.lexeme === 'pi' || identifierToken.lexeme === 'e') {
      return {
        kind: 'constant',
        name: identifierToken.lexeme,
      }
    }

    if (this.allowedVariables.has(identifierToken.lexeme)) {
      return {
        kind: 'variable',
        name: identifierToken.lexeme as VariableNode['name'],
      }
    }

    if (identifierToken.lexeme === 'x' || identifierToken.lexeme === 'y' || identifierToken.lexeme === 'z') {
      this.fail(
        'disallowed-variable-for-mode',
        `Variable "${identifierToken.lexeme}" is not available in ${MODE_DEFINITIONS[this.mode].label} mode.`,
        identifierToken,
      )
    }

    if (FUNCTION_ARITY.has(identifierToken.lexeme as SupportedFunctionName)) {
      this.fail(
        'unsupported-function',
        `Function "${identifierToken.lexeme}" must be called with parentheses, for example ${identifierToken.lexeme}(x).`,
        identifierToken,
      )
    }

    if (Object.hasOwn(this.parameterValues, identifierToken.lexeme)) {
      this.referencedParameters.add(identifierToken.lexeme)
      return {
        kind: 'parameter',
        name: identifierToken.lexeme,
      }
    }

    this.fail(
      'unknown-identifier',
      `Identifier "${identifierToken.lexeme}" is not defined in this formula.`,
      identifierToken,
    )
  }

  private parseCall(identifierToken: Token): ExpressionAst {
    this.advance()
    const argumentsList: ExpressionAst[] = []

    if (this.current().type !== 'rparen') {
      argumentsList.push(this.parseExpression())

      while (this.current().type === 'comma') {
        this.advance()
        argumentsList.push(this.parseExpression())
      }
    }

    if (this.current().type !== 'rparen') {
      this.fail(
        'mismatched-parentheses',
        'Check that every opening parenthesis has a matching closing parenthesis.',
        identifierToken,
      )
    }

    this.advance()

    if (
      identifierToken.lexeme === 'pi' ||
      identifierToken.lexeme === 'e' ||
      this.allowedVariables.has(identifierToken.lexeme) ||
      Object.hasOwn(this.parameterValues, identifierToken.lexeme)
    ) {
      this.fail(
        'implicit-multiplication',
        'Insert * between adjacent terms; implicit multiplication is not supported.',
        identifierToken,
      )
    }

    const supportedArity = FUNCTION_ARITY.get(identifierToken.lexeme as SupportedFunctionName)
    if (supportedArity === undefined) {
      this.fail(
        'unsupported-function',
        `Function "${identifierToken.lexeme}" is not supported.`,
        identifierToken,
      )
    }

    if (argumentsList.length !== supportedArity) {
      this.fail(
        'wrong-function-arity',
        `Function "${identifierToken.lexeme}" expects ${supportedArity} argument${supportedArity === 1 ? '' : 's'}, received ${argumentsList.length}.`,
        identifierToken,
      )
    }

    return {
      kind: 'call',
      name: identifierToken.lexeme as SupportedFunctionName,
      arguments: argumentsList,
    }
  }

  private current(): Token {
    return this.tokens[this.index]
  }

  private advance(): Token {
    const token = this.current()
    this.index += 1
    return token
  }

  private fail(
    code: ExpressionValidationErrorCode,
    message: string,
    token: Pick<Token, 'start' | 'end'>,
  ): never {
    throw new ParserError(
      createFailure({
        code,
        message,
        mode: this.mode,
        rawInput: this.rawInput,
        normalizedExpression: this.normalizedExpression,
        start: token.start,
        end: token.end,
      }),
    )
  }
}

function tokenize({
  mode,
  rawInput,
  normalizedExpression,
}: {
  mode: GraphMode
  rawInput: string
  normalizedExpression: string
}): Token[] {
  const tokens: Token[] = []
  let index = 0

  while (index < normalizedExpression.length) {
    const character = normalizedExpression[index]

    if (isWhitespace(character)) {
      index += 1
      continue
    }

    if (isDigit(character) || character === '.') {
      const numberToken = scanNumber(normalizedExpression, index)

      if (!numberToken.ok) {
        throw new ParserError(
          createFailure({
            code: 'malformed-numeric-literal',
            message: 'This numeric literal is malformed.',
            mode,
            rawInput,
            normalizedExpression,
            start: numberToken.start,
            end: numberToken.end,
          }),
        )
      }

      tokens.push({
        type: 'number',
        lexeme: numberToken.lexeme,
        start: numberToken.start,
        end: numberToken.end,
      })
      index = numberToken.end
      continue
    }

    if (isIdentifierStart(character)) {
      const start = index
      index += 1

      while (index < normalizedExpression.length && isIdentifierPart(normalizedExpression[index])) {
        index += 1
      }

      tokens.push({
        type: 'identifier',
        lexeme: normalizedExpression.slice(start, index),
        start,
        end: index,
      })
      continue
    }

    const tokenType = Object.hasOwn(tokenTypesBySymbol, character)
      ? tokenTypesBySymbol[character as keyof typeof tokenTypesBySymbol]
      : undefined
    if (tokenType) {
      tokens.push({
        type: tokenType,
        lexeme: character,
        start: index,
        end: index + 1,
      })
      index += 1
      continue
    }

    throw new ParserError(
      createFailure({
        code: 'unexpected-token',
        message: `Unsupported token "${character}" in the formula.`,
        mode,
        rawInput,
        normalizedExpression,
        start: index,
        end: index + 1,
      }),
    )
  }

  tokens.push({
    type: 'eof',
    lexeme: '',
    start: normalizedExpression.length,
    end: normalizedExpression.length,
  })

  return tokens
}

function scanNumber(
  expression: string,
  start: number,
):
  | {
      ok: true
      lexeme: string
      start: number
      end: number
    }
  | {
      ok: false
      start: number
      end: number
    } {
  let index = start
  let hasIntegerDigits = false

  while (index < expression.length && isDigit(expression[index])) {
    index += 1
    hasIntegerDigits = true
  }

  let hasFractionDigits = false
  if (expression[index] === '.') {
    index += 1

    while (index < expression.length && isDigit(expression[index])) {
      index += 1
      hasFractionDigits = true
    }
  }

  if (!hasIntegerDigits && !hasFractionDigits) {
    return {
      ok: false,
      start,
      end: index || start + 1,
    }
  }

  if (expression[index] === 'e' || expression[index] === 'E') {
    const exponentStart = index
    index += 1

    if (expression[index] === '+' || expression[index] === '-') {
      index += 1
    }

    const exponentDigitsStart = index
    while (index < expression.length && isDigit(expression[index])) {
      index += 1
    }

    if (exponentDigitsStart === index) {
      return {
        ok: false,
        start,
        end: exponentStart + 1,
      }
    }
  }

  if (expression[index] === '.') {
    return {
      ok: false,
      start,
      end: index + 1,
    }
  }

  return {
    ok: true,
    lexeme: expression.slice(start, index),
    start,
    end: index,
  }
}

function startsPrimary(token: Token): boolean {
  return token.type === 'number' || token.type === 'identifier' || token.type === 'lparen'
}

function createFailure({
  code,
  message,
  mode,
  rawInput,
  normalizedExpression,
  start,
  end,
}: {
  code: ExpressionValidationErrorCode
  message: string
  mode: GraphMode
  rawInput: string
  normalizedExpression: string
  start: number
  end: number
}): ExpressionValidationFailure {
  return {
    ok: false,
    mode,
    rawInput,
    normalizedExpression,
    error: createError(code, message, start, end),
  }
}

function createError(
  code: ExpressionValidationErrorCode,
  message: string,
  start: number,
  end: number,
): ExpressionValidationError {
  return {
    code,
    message,
    start,
    end,
  }
}

function isIdentifierStart(value: string): boolean {
  return /[A-Za-z]/.test(value)
}

function isIdentifierPart(value: string): boolean {
  return /[A-Za-z0-9_]/.test(value)
}

function isDigit(value: string | undefined): boolean {
  return value !== undefined && /[0-9]/.test(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isWhitespace(value: string): boolean {
  return /\s/.test(value)
}
