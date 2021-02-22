sub ok1()
    print "ok"
    exec(sub()
        print "ok"
    end sub)
end sub

function ok2()
    exec(function()
        return "ok"
    end function)
    return "ok"
end function

function ok3() as String
    exec(function() as String
        return "ok"
    end function)
    return "ok"
end function

sub error1()
    exec(sub()
        return "ko"
    end sub)
    return "ko"
end sub

function error2()
    print "ko"
    exec(function()
        print "ko"
    end function)
end function

function error3() as void
    print "ko"
    exec(function() as void
        print "ko"
    end function)
end function

sub exec(x)
end sub
