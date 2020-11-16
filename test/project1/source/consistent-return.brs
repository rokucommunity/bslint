sub error1()
    a = 0
    if a > 0
        return 1
    else
        return ' error
    end if
end sub

sub error2() as void
    return "nope" ' error
end sub

sub error3() as string
    return ' error
end sub

sub error4() as string ' error
end sub

function error5()
    return ' error
end function

sub error6() as string ' error
    a = 1
    if a > 0
        return a
    end if
end sub

sub error7() as string ' error
    for i = 0 to 10
        return i
    end for
end sub

sub error8()
    some(function () 'error
        if true then return 0
    end function)
end sub

sub error9()
    some(sub () as string 'error
    end sub)
end sub

sub ok1()
    return
end sub

function ok2()
end function

sub ok3() as string
    return 1
end sub

sub ok4() as string
    a = 1
    if a > 0
        return 1
    end if
    return 2
end sub

sub ok5()
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

sub some(o)
    print o
end sub
