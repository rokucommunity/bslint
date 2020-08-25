sub error1()
    print "ok"
    return
    print "nope" ' error
end sub

sub error2()
    a = 1
    return
    if a > 0 ' error
        print "nope"
    else
        print "still nope"
    end if
end sub

sub error3()
    a = 1
    if a > 0 then
        return
    else if a < 0 then
        return
    else
        return
    end if
    print "nope" ' error
end sub

sub error4()
    a = 1
    b = 2
    if a > 0 then
        if b > 0 then
            return
        else
            return
        end if
    else
        return
    end if
    print "nope" ' error
end sub

sub error5()
    a = 1
    b = 2
    if a > 0 then
        if b > 0 then
            return
            print "nope" ' error
        else
            return
        end if
    end if
    print "ok"
end sub

sub ok1()
    a = 1
    if a > 0 then
        return
    end if
    print "ok"
end sub

sub ok2()
    a = 1
    if a > 0 then
        return
    else if a < 0 then
        return
    else
    end if
    print "ok"
end sub

sub ok3()
    a = 1
    if a > 0 then
        return
    else if a < 0 then
    else
        return
    end if
    print "ok"
end sub

sub ok4()
    a = 1
    b = 2
    if a > 0 then
        if b > 0 then
            print "ok"
        else
            return
        end if
    else
        return
    end if
    print "ok"
end sub
