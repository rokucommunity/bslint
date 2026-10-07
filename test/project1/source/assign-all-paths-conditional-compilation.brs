function assignPathsCC() as dynamic
    #if true
        a = 1
    #else
        a = 2
    #end if
    return a ' no error
end function


function assignPathsCC1() as dynamic
    #if true
        a = 1
    #end if
    return a ' no error, #if true is always compiled
end function


function assignPathsCC2() as dynamic
    #if SOME_VAR
        a = 1
    #end if
    return a ' error, SOME_VAR is undeclared so false, a is never assigned
end function


function assignPathsCC3() as dynamic
    #if SOME_VAR
        a = 1
    #else
        a = 2
    #end if
    return a ' no error
end function

function assignPathsCC4() as dynamic
    #if SOME_VAR
        b = 1
    #else
        a = 2
    #end if
    return a ' no error, SOME_VAR is false so the #else branch assigns a
end function


function assignPathsCC5() as dynamic
    #if SOME_VAR
        a = 1
    #else if SOME_VAR2
        a = 2
    #else
        a = 3
    #end if
    return a ' No error
end function

function assignPathsCC6() as dynamic
    #if SOME_VAR
        a = 1
    #else if SOME_VAR2
        a = 2
    #else
        ' missing assignment
    #end if
    return a ' error, every condition is false and the #else branch does not assign a
end function

function assignPathsCC7() as dynamic
    #if SOME_VAR
        a = 1
    #else if SOME_VAR2
        ' missing assignment
    #else
        a = 2
    #end if
    return a ' no error, only the #else branch is live and it assigns a
end function