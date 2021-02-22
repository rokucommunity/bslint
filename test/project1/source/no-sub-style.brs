function ok()
    print "ok"
    exec(function()
        print "ok"
    end function)
end function

sub error()
    print "ko"
    exec(sub()
        print "ko"
    end sub)
end sub

function exec(x)
end function
