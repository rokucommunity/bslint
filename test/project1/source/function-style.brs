sub test1()
    print "ok"
    exec(sub()
        print "ok"
    end sub)
end sub

function test2()
    print "ko"
    exec(function()
        print "ko"
    end function)
    return "ko"
end function

function test3() as void
    print "okko"
end function

sub exec(x)
    return
    print "unreachable"
end sub
