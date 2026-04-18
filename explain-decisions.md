1. Trade-offs: What trade-offs did you make in Parts 2 and 3? For example, did you prioritize
simplicity over extensibility, or vice versa? Why?

What was traded off in this project:
The main trade-off was simplicity vs. extensibility. 
Here's what that means in plain terms:
Simplicity means the code is easy to read and understand right now, while extensibility means it's easy to add new features later.

In this project, the choice leaned toward extensibility by using a factory function pattern (where each validator is its own self-contained unit). 
This made the code slightly more complex to read at first glance, but it means adding a new rule, only requires adding one new function without touching anything else.

The other trade-off was precision vs. performance. Using BigNumber.js for all math is slower than native JavaScript numbers,
but it was the right call because gold trading involves real money, a rounding error of 0.000001 could mean a financial mistake at scale.


2. Alternatives: What alternative approaches did you consider for the validation logic? Why
did you choose the approach you used?

**Alternative 1 — One big validation function:** You could write a single giant function that checks everything in one place. 
It's simple to start, but it becomes a nightmare to maintain as rules grow. 

**Alternative 2 — Class-based validators:** Using a JavaScript `class` with methods is a popular pattern. 
It was considered but passed over because factory functions are lighter (no `this` confusion, no inheritance complexity) 
and easier for a team to reason about quickly.

**The chosen approach — pipeline of small validators:** Each rule is its own small function. They all get composed together in a pipeline (one after another).



3. Debugging process: Walk us through how you analyzed the flawed code in Part 1. What
did you look at first? How did you prioritize which issues were most severe?


**Step 1 — Read the code top to bottom first.** Before changing anything, you want a full picture. Don't assume the first bug you spot is the only one.

**Step 2 — Prioritize by severity.** Some bugs are kitchen fires (the app crashes or gives wrong answers), 
and some are just presentation issues (the output could look nicer). 
Severity-first means: fix the dangerous stuff before the cosmetic stuff.

**Step 3 — Look for the most common bug categories in financial code:**

- **Floating point errors** — JavaScript's `0.1 + 0.2 !== 0.3` problem. This is a high-priority fire in money math.
- **Missing edge case handling** — What happens if the order quantity is `0`, negative, or `null`? Unhandled edges crash production.
- **Wrong comparison logic** — Using `==` instead of `===`, or comparing in the wrong direction (e.g., `price < min` instead of `price > max`).


4. Evolution: If this validation module needed to grow into a production service handling
thousands of orders per minute, what would you change about your current design? What
would you keep?


What you'd change:
The current design runs everything in one process sequentially. At thousands of orders per minute, this becomes a bottleneck 
— like having one chef handle every single plate alone. Here's what would need to evolve:

First, worker threads would be introduced to allow validations to run in parallel,
 forming a proper worker pool that can process multiple orders simultaneously.

Second, you'd add a queue system (like Redis or RabbitMQ) so orders don't pile up and crash the server. 
Think of it like a ticket system at a busy restaurant — orders come in, get queued, and workers pick them up as they're ready.

Third, validation rules would move to a config file or database instead of being hardcoded. 
This way, a business analyst can change the minimum order quantity without a developer needing to redeploy code.

What you'd keep:
The factory function pipeline pattern is actually production-grade already 
— it's composable, testable, and stateless (meaning each validation doesn't depend on what happened before it). 
The BigNumber.js usage for precision would stay too, because the financial accuracy requirement doesn't go away at scale.



5. Tools: If you used AI tools or other references for any part of this assessment, which parts
did you use them for? How did you verify the output was correct?

Yes, AI tools (like Claude) were used for scaffolding and thinking through patterns, 
particularly for the BigNumber.js precision handling and the overall pipeline architecture.

However, every output was verified by:

First, running the actual code and checking outputs manually against known inputs 
for example, deliberately passing an invalid order and confirming the validator caught it. 

Second, reading the generated code line by line and being able to explain what each line does in plain English. 
If you can't explain it, you don't own it. 

Third, cross-referencing the BigNumber.js documentation to confirm the methods used (isGreaterThan, toFixed, etc.) matched the official API.



