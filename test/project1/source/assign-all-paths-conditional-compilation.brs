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
    return a ' not really an error because #else block will never be run, but displays one anyway. Maybe fix this
end function


function assignPathsCC2() as dynamic
    #if SOME_VAR
        a = 1
    #end if
    return a ' error
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
    return a '  error
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
    return a '  error
end function

function assignPathsCC7() as dynamic
    #if SOME_VAR
        a = 1
    #else if SOME_VAR2
        ' missing assignment
    #else
        a = 2
    #end if
    return a '  error
end function