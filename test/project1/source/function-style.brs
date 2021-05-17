sub ok()
    print "ok"
    exec(sub()
        print "ok"
    end sub)
end sub

function error()
    print "ko"
    exec(function()
        print "ko"
    end function)
    return "ko"
end function

sub exec(x)
    return
    print "unreachable"
end sub
