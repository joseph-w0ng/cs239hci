[+0.5] Update your problem statement.\
Many users are becoming aware of web cookies but lack a clear understanding of their function and implications. According to our user research, about half of internet users recognize the existence of cookies and do not want their personal data being collected. Their knowledge of cookies, however, is often superficial, making it difficult for the users to distinguish between essential cookies that enhance functionality and those that pose privacy risks. Due to regulations, most websites are required to ask for cookie consent, but the cookie consent requests are often vague and manipulative, leaving users with options such as accepting all or rejecting. 

This presents an issue that: users want a convenient and secure browsing experience but are frequently interrupted by cookie consent requests that they do not fully comprehend. Due to the intrusive and manipulative nature of the cookie pop-ups, the users often feel gaslighted and make uninformed choices about what kinds of cookies they agree to share with the websites.

[+1] Create a paper prototype. Take + upload pictures or a video of your paper prototype.\
[Figma Prototype](https://www.figma.com/proto/kGQS7KU01GcNaxs7sVkj7t/CS-239-Figma-Wireframe?node-id=107-768&t=X1BBUhslb7RLZC3o-1&show-proto-sidebar=1&starting-point-node-id=107%3A768)

[+0.5] Summarize 1-3 takeaways from the feedback you received in class.\
- Make purpose of buttons clear. Make sure the buttons to activate / de-activate certain cookies is labeled.
- Maybe provide statistics on how many users enable/disable a certain cookie
- Maybe add presets so that certain types of cookies are disabled by default, and allow opt-in for other cookies
  
[+1] Articulate your design goals as you start to implement a high-fidelity prototype of your interactive system.

- Design goal 1:
  - What is the goal? Simple, easy-to-understand visualization of active cookies which are collecting a user's data on a given site.
  - Why is this important? Through giving and receiving feedback with paper prototypes / Figma wireframes as well as interviews, users expressed that they do not want to read a lot of text, and that they will only look at brief snippets in order to manage their cookie preferences. On top of that, we have received from peers that color-coding different cookies might be helpful for the users to recognize different kinds of cookies. 
  - How will you design for this goal? Provide short summaries of cookie data being collected, eliminate technical jargon, color code cookies by their function (colors ranging from green to yellow to red to represent how "harmful" a certain cookie is functional, session, performance, tracking, etc.)
 
- Design goal 2:
  - What is the goal? Easy way to customize default cookie preferences for all sites, with option to override default settings.
  - Why is this important? Follow-up interviews (and our survey) revealed that users strongly dislike cookie popups, and want to be able to set cookie preferences by default for all sites in one tool. However, users also wanted the ability to customize the cookies they allow on different sites.
  - How will you design for this goal? Provide default settings that apply to all sites, but also allow users to allow additional cookies on certain sites and save the user's preferences.
 
- Design goal 3:
  - What is the goal? Simple explanations on different cookies when the user wants to inquire for more.
  - Why is this important? From the survey feedback, most users expressed that they would like the option to know a little bit more about cookies, but they don't necessarily want to have the explanations to be over the top. 
  - How will you design for this goal? working with LLMs to dynamically provide very brief explanations in context. (how will the cookie work on a specific website) For example, if a user is on Amazon and asks about session cookies, the explanation will explaine in the context of Amazon, making it easier to understand. 


[+1] Provide a plan for implementation. Create a timeline, find sync points, and assign tasks. Suggestion: Work backwards from the March 4 pilot deadline.

Feb 24-28: Finalize design; parallel prototyping and asking users for feedback. Decide on a design to prototype.\
        Each member of the group will work in parallel and collectively on the prototype. 
Fed 28: Converge on the design and work together on the same prototype.
Mar 1-2: Have a working prototype ready.\
Mar 3: Finish basic testing, and make sure there are no obvious bugs.

What did each member contribute to this phase of the project?

Joseph: Built the Figma prototype, contributed with design goals\
Beide: Updated the problem statement, made changes to the Figma prototype, helped with design goals

Did you use a generative AI tool? If so, which and how?
No
