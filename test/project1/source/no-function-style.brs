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
end function

sub exec(x)
end sub
