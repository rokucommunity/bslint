sub error1()
    a = 0
    if a > 0
        return 1
    else
        return ' error
    end if
end sub

function error2() as void
    return "nope" ' error
end function

sub error3() as string
    return ' error
end sub

sub error4() as string ' error
end sub

function error5()
    return ' error
end function

sub error6() as integer ' error
    a = 1
    if a > 0
        return a
    end if
end sub

sub error7() as integer ' error
    for i = 0 to 10
        return i
    end for
end sub

sub error8()
    some(function() 'error
        if true then return 0
    end function)
end sub

sub error9()
    some(sub () as string 'error
    end sub)
end sub

function error10() as integer
    a = 1
    if a > 0
        throw "something wrong"
    else
        ' missing return or throw here
    end if
end function

sub ok1()
    return
end sub

function ok2()
end function

sub ok3() as dynamic
    return 1
end sub

sub ok4() as dynamic
    a = 1
    if a > 0
        return 1
    end if
    return 2
end sub

sub ok5() as integer
    a = 1
    b = 2
    if a > 0 then
        if b > 0 then
            return 1
        else
            return 2
        end if
    else
        return 3
    end if
end sub

function ok6() as void
    return ' error
end function

function ok7() as integer
    a = 1
    if a > 0
        throw "something wrong"
    else
        return 0
    end if
end function

function ok8() as integer
    throw "Not yet implemented"
end function

function ok9() as integer
    try
        a = 0
        b = 100 / a
        return b
    catch err
        throw "Not yet implemented"
    end try
end function

function ok10() as integer
    throw "Not yet implemented"
end function

function ok11() as void
    a = 1
    if a > 0
        throw "something wrong"
    end if
end function

sub some(o)
    print o
end sub
