#### Pilot [+1]



1. [+0.5] Present the pilot user with a brief statement of the scenario and task. Ask the pilot user to complete the task. Note: You might feel (very) nervous that something will break. That is OK. It's ok for the pilot user to break things as they test out your system. Be prepared to restart/recover your system when things break. Note what happened step by step. Include 0.5-1p of notes on one pilot user. Additionally, summarize in a few sentences: What happened? Why? What changes do you need to make to your system before the next pilot?

	Important: This pilot was done before we made changes to the system 


    Our first user during the pilot needed us to point out that there was an extension, but for the most part navigated the plugin quite easily. There was some confusion regarding certain interface design choices and word choices we made, but for the most part nothing unanticipated broke during our pilot. Before the next pilot, we need to finish up the feature to allow users to control what cookies are blocked.


    Notes:



* Rename “essential” cookies to “Necessary”
    * Essential implies to some users that these are the essential cookies they need to review
* Need to make it not possible to delete essential cookies as they make the site function
* Hover items to explain “Secure” and “HttpOnly”
* In general users prefer hovering over clicking
    * Hover time is also slightly too long
* UI generally smooth and intuitive to use
* Reverse the order of the cookie categories
    * Users want to review the ones that track their data, not the ones that are necessary regardless
* Select cookies option is confusing
* Replace x on the cookie category graph with trash can icon
    * Users thought it was just filtering the cookies
* Need to re-render cookies after delete
2. [+0.5] Involve another pilot user outside of the course. Include 0.5-1p of notes on this second pilot user. Summarize in a few sentences: What happened? Why? What changes do you need to make to your system before the next pilot?

    Important: This pilot was done before we made changes to the system 


    For our second pilot we did a better job of planning out what websites the users could use. We picked out sites that had more cookies and multiple varieties of cookies so that users could visualize the differences. The user decided to go to one of the shopping websites we recommended and scrolled through the page quickly before clicking the extension. They noticed that when the page changed the badge number on the extension changed, and liked that as it brought attention to the extension. They liked the colors and how they related to the seriousness of the cookies for the summary bar and they thought the visual was easy to understand. They clicked the `Manage Block List` a few times but nothing happened. This was as expected. They then clicked the “x” on one of the cookie types and were a little confused on the purpose of it. After they scrolled down the accordions and played around with individual cookies. They were a little confused about what the secure and HttpOnly tags meant. They then deleted a few cookies. The last thing they did on their own was click the “selectable” toggle and then they selected some cookies and batch deleted them but they did not disappear from the list (this was a bug). After, I told them they can click on the individual cookie and get more information so they did that and tried to generate the AI summary but that also was not implemented yet. 


    Notes: 

* Change the “x” to a trash icon to make it more clear. It seemed they thought it was a filter and they were removing the filter
* Add hover descriptions throughout the UI to make it clear on what tags and buttons are
* Reload button doesn’t really make sense on what it’s doing. 
* Essential cookies shouldn’t be selectable as they aren’t deletable
* Manage block list would be helpful to undo deleted cookies, so prioritize implementing that
* Maybe make marketing cookies a little easier to understand (They often include substrings of the data provider ex: facebook, google, adobe, so maybe making that clearer on where the data was going could be a good idea. 
* List news to rerender after delete.  


#### Before conducting an evaluation [+3]

1. [+0.5] Articulate1-2 questions motivating the evaluation. In other words, what are the 1-2 things you want to prioritize learning through the evaluation?



* How convenient is it for users to understand what data is being collected from them on a particular website?
* Is the extension useful for users to be able to automatically choose cookies to allow/block for a given page?

2. [+0.5] What metrics will you use to answer the above research questions? Why are these metrics appropriate? What are the benefits and drawbacks of using these metrics?



* Requirements: You are required to conduct a mixed-methods study where you collect qualitative and quantitative data. In your response to this question, describe what kind of data (e.g., open-ended survey, interview, time, clicks, etc.) will be useful for answering your motivating questions. 

We will want to measure the amount of time it takes for users to finish managing their cookie preferences for a given page. We will also want to do a semi-structured interview to figure out how effective our interface is.

3. [+1] Specify a plan for recruiting participants.



* How will you contact participants (e.g., mailing lists, in-person, etc)?
* What are your inclusion/exclusion criteria for participants? 
* Will you include participants you interviewed for user research? Why or why not?
* Where will you perform the evaluation?
* What data will you collect from participants? How will you inform them of this and obtain informed consent?

We will reach out to people we know in person or on Discord. We will want to recruit participants who care about their cookies, but do not necessarily have a deep understanding of how they work. I think it is useful to include participants we interviewed for user research, as it would give us an understanding of whether or not the outcomes we gathered from user research were met. We will perform the evaluation either on a live video call or in person. We will collect the time it took them to manage their cookies on a certain page, as well as the responses they provide in the following interview, and we will inform them of this before the session starts and make sure they agree before proceeding with the evaluation.

4. [+1] Write out a step-by-step protocol for conducting each user evaluation. Getting on the same page is important for more easily conducting studies and analyzing data across participants. Your protocol should include: (1) a script of what you will say to each participant; (2) what behaviors/responses you expect from participants and how that may change the flow of the study, if at all; and (3) how you will transition between phases of the study (e.g., from a task to an interview). 



* We would first ask the participants to share some of the websites/domains they frequent often
    * “What are some common websites that you use?”
    * We would expect some common websites such as Amazon, Tiktok, nytimes, school websites, Netflix, YouTube, Google, and clothing brands. 
    * From the answers, we would select a few websites from users’ answer
    * If the websites are uncommon, it is okay and proceed with that one. 
* Then, we would let the user first browse around the websites, performing normal tasks 
    * “Just browse around like normal.”
    * We expect some actions around the websites but nothing unusual 
* After one minute, we would step in and ask the users about cookies 
    * “Hey, are you curious about what cookies are active on the page?”
    * If the user said yes
        * We would tell them about the system
        * “Here is a plugin we developed to manage cookies. here, give it a try.”
    * If the user said no
        * We would tell them about the system
        * “No worries, here is a plugin we made for you, it tells you what kind of data the websites are tracking from you.”
* Let the user become familiar with the systems first.
    * “Just play around with it. If you broke it, we have prize money.”
        * We would observe the users clicking around and see the general workflow of the system.
* After the users have tried out most of the systems, we would step in and switch to another website that user mentioned in step 1
    * “Alright, it seems like you got pretty familiar with the plugin. Now let's go to another site and try it there.”
* Enter the other site, now assign a task to the user to identify and remove non-essential cookies
    * “....sweet, here we are, now let's say you are really paranoided about the websites and don’t want them to track your data. You want to use the software to remove the nonessential cookies.”
    * The users should now be able to click around and remove the cookies.
    * If the users have trouble, jot down notes on how and where they were struggling for future development
* Finish the task and enter the interview portion
    * “Ahh, nice one. Now I have a few questions for you.”
    * “From 1-10, how would you rate the flow of the plugini?”
    * “Were you struggling at all?”
    * “Did you feel safer after removing all the marketing/analytical cookies?”


#### For fun [+0.5]



1. [+0.5] Name your system!

    Cookie Monster

2. [+0.5] DEPTH: Design a logo for your system. Include a PNG in your repo. Add it to the README. 

        Included PNG in the repo


Did you use a generative AI tool for this assignment? If so, which tool(s) and how? No

How much time did you spend on this assignment

- as a group? 3 hours

