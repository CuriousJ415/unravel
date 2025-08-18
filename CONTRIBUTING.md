# Contributing to Unravel

Thank you for your interest in contributing to Unravel! This project welcomes feedback, bug reports, and suggestions for improvement.

## Getting Started

1. **Test the application** thoroughly with different patterns and providers
2. **Run the test suite** to verify functionality: `npm run test:quick`
3. **Check existing issues** before creating new ones

## Reporting Issues

When reporting bugs or issues, please include:

### Required Information
- **Unravel version** or commit hash
- **Operating system** and browser
- **Steps to reproduce** the issue
- **Expected vs actual behavior**

### Diagnostic Information
Run the automated test suite and include the output:
```bash
npm run test:quick
```

This generates helpful diagnostic information including:
- System health status
- Pattern loading status
- Provider connectivity
- API endpoint functionality

### Test Report
The test suite automatically generates a detailed report saved as:
`tests/test-report-[timestamp].json`

Please attach this file to your issue report.

## Suggesting Patterns

Unravel includes 35 patterns covering common AI tasks. If you have ideas for additional patterns:

### Pattern Suggestions Should Include:
- **Use case description** - What problem does this solve?
- **Target audience** - Who would use this pattern?
- **Frequency of use** - Daily, weekly, occasional?
- **Similar existing patterns** - How is this different?

### Pattern Quality Standards:
- **Broad appeal** - Useful to many people, not niche/esoteric
- **Clear instructions** - Well-defined input/output format
- **Professional tone** - Appropriate for business and personal use
- **Proper disclaimers** - For legal, medical, or financial content

## Code Contributions

### Before Contributing Code:
1. **Discuss the change** in an issue first
2. **Run the test suite** to ensure nothing breaks
3. **Follow existing code style** and patterns
4. **Test with multiple AI providers** when possible

### Development Setup:
```bash
# Clone and setup
git clone https://github.com/[username]/unravel.git
cd unravel
npm install

# Run in development mode
npm run dev

# Run tests
npm test
```

### Areas for Contribution:
- **New patterns** - Following established format and quality standards
- **Provider integrations** - Support for additional AI services
- **UI improvements** - Better user experience and accessibility
- **Testing enhancements** - Additional test coverage
- **Documentation** - Improvements to guides and examples

## Pattern Development Guidelines

If contributing new patterns, follow this structure:

### File Structure:
```
patterns/
  pattern_name/
    system.md    # Required: Main pattern instructions
    user.md      # Optional: Additional user context
```

### Pattern Format:
```markdown
# IDENTITY and PURPOSE

You are an expert [role] who [primary function]. [Context about expertise].

Take a deep breath and think step-by-step about [approach description].

# STEPS

- [Step 1 description]
- [Step 2 description]
- [Additional steps...]

# OUTPUT SECTIONS

- [Section 1] - [Description]
- [Section 2] - [Description]
- [Additional sections...]

# OUTPUT INSTRUCTIONS

- [Instruction 1]
- [Instruction 2]
- [Additional instructions...]

# INPUT

INPUT:
```

### Pattern Quality Checklist:
- [ ] Clear, specific identity and purpose
- [ ] Step-by-step methodology
- [ ] Structured output format
- [ ] Professional, helpful tone
- [ ] Appropriate disclaimers (if needed)
- [ ] Tested with multiple AI providers
- [ ] Broad appeal and usefulness

## Testing Guidelines

### Required Testing:
- **Functionality test**: Pattern loads and processes correctly
- **Multi-provider test**: Works with different AI providers
- **Edge case test**: Handles unusual or minimal input
- **Output quality test**: Produces useful, well-formatted results

### Test Commands:
```bash
# Full test suite
npm test

# Quick functionality check
npm run test:quick

# Continuous monitoring
npm run monitor
```

## Documentation Standards

### For README updates:
- **Factual tone** - Avoid marketing language
- **Clear instructions** - Step-by-step, testable
- **Honest limitations** - What doesn't work well
- **Helpful examples** - Real-world usage scenarios

### For code documentation:
- **Clear comments** for complex logic
- **Function documentation** for public APIs
- **Setup instructions** for development environment
- **Troubleshooting guides** for common issues

## Community Guidelines

### Communication:
- **Be respectful** and constructive in discussions
- **Focus on the issue** rather than personal opinions
- **Provide context** and specific examples
- **Help others** when you can

### Quality over quantity:
- **Test thoroughly** before submitting
- **Research existing solutions** before proposing new ones
- **Consider maintenance burden** of new features
- **Think about user experience** impact

## Getting Help

If you need help contributing:

1. **Check the documentation** first
2. **Run the test suite** for diagnostic information
3. **Search existing issues** for similar questions
4. **Create a new issue** with specific questions and context

## Recognition

Contributors will be acknowledged in:
- Project documentation
- Release notes for significant contributions
- Special thanks for pattern contributions

---

**Thank you for helping make Unravel better!**

*Every contribution, from bug reports to new patterns, helps the community.*