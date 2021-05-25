sub ok()
    print "ok"
    exec(sub()
        print "ok"
    end sub)
end sub

sub error()
    print "ko"
    exec(sub()
        print "ko"
    end sub)
    return "ko"
end sub

sub exec(x)
    return
    print "unreachable"
end sub
