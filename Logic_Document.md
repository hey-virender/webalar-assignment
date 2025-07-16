# How I implemented "Smart Assign"

For smart assign taskService fetchs all the user, and for each user it counts how many task with status "todo" or "inProgress" is assigned to each user and then using Math.min() function it finds the user with lowest task assign count and assign current task to that user.


# How I handle conflict resolver

For conflict resolve there are some fields in the task model. First one is version, to track the version of task, and then editingSession whihch is an array of userId, startedAt and lastActivity which tracks the editing session. Then in the update task event it emits a startEditing which joins the user to that task, add the activity details to that particular task or update the lastActivity field if an active session already exists. For analyzing conficts there is a function in taskService that checks and compare the changes in the fields and generate conflict data. This anaylisConfict function is use in updateTask based on versions of client and server task and if conflict occurs, the most recent user who is editing the task get a popup while updating task, showing the conflict and options to keep his own version or other user's version. While updating task it also shows if some other user is editing same task so they can coordinate between each other.
